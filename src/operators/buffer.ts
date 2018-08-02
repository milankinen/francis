import { sendNextInTx, Source } from "../_core"
import { makeEventStream } from "../_obs"
import { Transaction } from "../_tx"
import { EventStream } from "../EventStream"
import { OnTimeout, scheduleTimeout, Timeout } from "../scheduler/index"
import { Operator } from "./_base"

export function bufferWithTime<T>(delay: number, stream: EventStream<T>): EventStream<T[]> {
  return makeEventStream(new Buffer(stream.src, Infinity, delay))
}

export function bufferWithCount<T>(count: number, stream: EventStream<T>): EventStream<T[]> {
  return makeEventStream(new Buffer(stream.src, count, -1))
}

export function bufferWithTimeOrCount<T>(
  delay: number,
  count: number,
  stream: EventStream<T>,
): EventStream<T[]> {
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
