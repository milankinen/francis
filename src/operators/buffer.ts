import { checkEventStream, checkNaturalInt, checkPositiveInt } from "../_check"
import { sendNextInTx, Source } from "../_core"
import { makeEventStream } from "../_obs"
import { Transaction } from "../_tx"
import { curry2, curry3 } from "../_util"
import { EventStream } from "../EventStream"
import { dispatcherOf, Observable } from "../Observable"
import { OnTimeout, scheduleTimeout, Timeout } from "../scheduler/index"
import { Operator } from "./_base"

export const bufferWithTime: CurriedBufferWithTime = curry2(_bufferWithTime)
export interface CurriedBufferWithTime {
  <ValueType>(delay: number, stream: EventStream<ValueType>): EventStream<ValueType[]>
  (delay: number): <ValueType>(stream: EventStream<ValueType>) => EventStream<ValueType[]>
}

export const bufferWithCount: CurriedBufferWithCount = curry2(_bufferWithCount)
export interface CurriedBufferWithCount {
  <ValueType>(count: number, stream: EventStream<ValueType>): EventStream<ValueType[]>
  (count: number): <ValueType>(stream: EventStream<ValueType>) => EventStream<ValueType[]>
}

export const bufferWithTimeOrCount: CurriedBufferWithTimeOrCount = curry3(_bufferWithTimeOrCount)
export interface CurriedBufferWithTimeOrCount {
  <ValueType>(delay: number, count: number, stream: EventStream<ValueType>): EventStream<
    ValueType[]
  >
  (delay: number): <ValueType>(
    count: number,
    stream: EventStream<ValueType>,
  ) => EventStream<ValueType[]>
  (delay: number, count: number): <ValueType>(
    stream: EventStream<ValueType>,
  ) => EventStream<ValueType[]>
  (delay: number): (
    count: number,
  ) => <ValueType>(stream: Observable<ValueType>) => EventStream<ValueType[]>
}

function _bufferWithTime<T>(delay: number, stream: EventStream<T>): EventStream<T[]> {
  checkNaturalInt(delay)
  checkEventStream(stream)
  return makeEventStream(new Buffer(dispatcherOf(stream), Infinity, delay))
}

function _bufferWithCount<T>(count: number, stream: EventStream<T>): EventStream<T[]> {
  checkPositiveInt(count)
  checkEventStream(stream)
  return makeEventStream(new Buffer(dispatcherOf(stream), count, -1))
}

function _bufferWithTimeOrCount<T>(
  delay: number,
  count: number,
  stream: EventStream<T>,
): EventStream<T[]> {
  checkNaturalInt(delay)
  checkPositiveInt(count)
  checkEventStream(stream)
  return makeEventStream(new Buffer(dispatcherOf(stream), count, delay))
}

class Buffer<T> extends Operator<T, T[]> implements OnTimeout {
  private to: Timeout | null = null
  private b: T[] = []

  constructor(source: Source<T>, private readonly count: number, private readonly delay: number) {
    super(source)
  }

  public dispose(): void {
    this.reset()
    super.dispose()
  }

  public next(tx: Transaction, val: T): void {
    this.b.push(val)
    if (this.b.length >= this.count) {
      this.flush(tx)
    } else if (this.delay >= 0 && this.to === null) {
      this.to = scheduleTimeout(this, this.delay)
    }
  }

  public end(tx: Transaction): void {
    if (this.b.length > 0) {
      this.flush(tx)
    }
    this.active && this.sink.end(tx)
  }

  public due(): void {
    this.to = null
    this.flush(null)
  }

  private flush(tx: Transaction | null): void {
    const buffer = this.b
    this.reset()
    if (tx !== null) {
      this.sink.next(tx, buffer)
    } else {
      sendNextInTx(this.sink, buffer)
    }
  }

  private reset(): void {
    this.b = []
    if (this.to !== null) {
      this.to.cancel()
      this.to = null
    }
  }
}
