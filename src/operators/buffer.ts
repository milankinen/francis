import { checkEventStream, checkNaturalInt, checkPositiveInt } from "../_check"
import { sendNextInTx, Source } from "../_core"
import { makeEventStream } from "../_obs"
import { Transaction } from "../_tx"
import { curry2, curry3 } from "../_util"
import { EventStream } from "../EventStream"
import { Observable } from "../Observable"
import { OnTimeout, scheduleTimeout, Timeout } from "../scheduler/index"
import { Operator } from "./_base"

export interface BufferWithTimeOp {
  <T>(delay: number, observable: Observable<T>): Observable<T[]>
  <T>(delay: number): (observable: Observable<T>) => Observable<T[]>
}

export interface BufferWithCountOp {
  <T>(count: number, observable: Observable<T>): Observable<T[]>
  <T>(count: number): (observable: Observable<T>) => Observable<T[]>
}

export interface BufferWithTimeOrCountOp {
  <T>(delay: number, count: number, observable: Observable<T>): Observable<T[]>
  <T>(delay: number): (count: number, observable: Observable<T>) => Observable<T[]>
  <T>(delay: number, count: number): (observable: Observable<T>) => Observable<T[]>
  <T>(delay: number): (count: number) => (observable: Observable<T>) => Observable<T[]>
}

export const bufferWithTime: BufferWithTimeOp = curry2(_bufferWithTime)
export const bufferWithCount: BufferWithCountOp = curry2(_bufferWithCount)
export const bufferWithTimeOrCount: BufferWithTimeOrCountOp = curry3(_bufferWithTimeOrCount)

function _bufferWithTime<T>(delay: number, stream: EventStream<T>): EventStream<T[]> {
  checkNaturalInt(delay)
  checkEventStream(stream)
  return makeEventStream(new Buffer(stream.src, Infinity, delay))
}

function _bufferWithCount<T>(count: number, stream: EventStream<T>): EventStream<T[]> {
  checkPositiveInt(count)
  checkEventStream(stream)
  return makeEventStream(new Buffer(stream.src, count, -1))
}

function _bufferWithTimeOrCount<T>(
  delay: number,
  count: number,
  stream: EventStream<T>,
): EventStream<T[]> {
  checkNaturalInt(delay)
  checkPositiveInt(count)
  checkEventStream(stream)
  return makeEventStream(new Buffer(stream.src, count, delay))
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
