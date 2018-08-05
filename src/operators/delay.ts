import { sendEndInTx, sendNextInTx, Source } from "../_core"
import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { curry2 } from "../_util"
import { Observable } from "../Observable"
import { OnTimeout, scheduleTimeout, Timeout } from "../scheduler/index"
import { InitialAndChanges } from "./_changes"

export interface DelayOp {
  <T>(time: number, observable: Observable<T>): Observable<T>
  <T>(time: number): (observable: Observable<T>) => Observable<T>
}

export const delay: DelayOp = curry2(_delay)

function _delay<T>(time: number, observable: Observable<T>): Observable<T> {
  return makeObservable(observable, new Delay(observable.src, time))
}

class Delay<T> extends InitialAndChanges<T> {
  private h: Delayed<T> | null = null
  private t: Delayed<T> | null = null

  constructor(source: Source<T>, private readonly time: number) {
    super(source)
  }

  public dispose(): void {
    let head = this.h
    this.t = this.h = null
    while (head !== null) {
      head.to.cancel()
      head = head.t
    }
    super.dispose()
  }

  public nextInitial(tx: Transaction, val: T): void {
    this.sink.next(tx, val)
  }

  public nextChange(tx: Transaction, val: T): void {
    this.t !== null
      ? (this.t = this.t.t = new Delayed(this.time, this, val, this.t, null))
      : (this.t = this.h = new Delayed(this.time, this, val, null, null))
  }

  public end(tx: Transaction): void {
    if (this.t === null) {
      this.sink.end(tx)
    } else {
      this.t = this.t.t = new DelayedEnd(this.time, this, null, this.t, null)
    }
  }

  public delayedNext(d: Delayed<T>) {
    d.h !== null ? (d.h.t = d.t) : (this.h = d.t)
    d.t !== null ? (d.t.h = d.h) : (this.t = d.h)
    sendNextInTx(this.sink, d.v)
  }

  public delayedEnd(d: Delayed<T>) {
    d.h !== null ? (d.h.t = d.t) : (this.h = d.t)
    d.t !== null ? (d.t.h = d.h) : (this.t = d.h)
    sendEndInTx(this.sink)
  }
}

class Delayed<T> implements OnTimeout {
  public readonly to: Timeout

  constructor(
    time: number,
    public readonly d: Delay<T>,
    public readonly v: T,
    public h: Delayed<T> | null,
    public t: Delayed<T> | null,
  ) {
    this.to = scheduleTimeout(this, time)
  }

  public due(): void {
    this.d.delayedNext(this)
  }
}

class DelayedEnd extends Delayed<any> {
  public due(): void {
    this.d.delayedEnd(this)
  }
}
