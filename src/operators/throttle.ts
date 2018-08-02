import { NONE, sendEndInTx, sendNextInTx, Source } from "../_core"
import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { EventStream } from "../EventStream"
import { Observable } from "../Observable"
import { Property } from "../Property"
import { OnTimeout, scheduleTimeout, Timeout } from "../scheduler/index"
import { InitialAndChanges } from "./_changes"

export function throttle<T>(delay: number, observable: Property<T>): Property<T>
export function throttle<T>(delay: number, observable: EventStream<T>): EventStream<T>
export function throttle<T>(delay: number, observable: Observable<T>): Observable<T>
export function throttle<T>(delay: number, observable: Observable<T>): Observable<T> {
  return makeObservable(observable, new Throttle(observable.src, delay))
}

export abstract class ThrottleBase<T> extends InitialAndChanges<T> implements OnTimeout {
  protected to: Timeout | null = null

  constructor(source: Source<T>, protected delay: number) {
    super(source)
  }

  public dispose(): void {
    this.resetTimeout()
    super.dispose()
  }

  public nextInitial(tx: Transaction, val: T): void {
    this.sink.next(tx, val)
  }

  public abstract nextChange(tx: Transaction, val: T): void

  public abstract due(): void

  protected resetTimeout(): void {
    if (this.to !== null) {
      this.to.cancel()
      this.to = null
    }
  }

  protected ensureTimeout(): void {
    if (this.to === null) {
      this.to = scheduleTimeout(this, this.delay)
    }
  }
}

export class Throttle<T> extends ThrottleBase<T> {
  protected memo: T = NONE
  protected ended: boolean = false

  public dispose(): void {
    this.memo = NONE
    this.ended = false
    super.dispose()
  }

  public nextChange(tx: Transaction, val: T): void {
    this.memo = val
    this.ensureTimeout()
  }

  public end(tx: Transaction): void {
    this.ended = true
    if (this.to === null) {
      this.sink.end(tx)
    }
  }

  public due(): void {
    this.to = null
    sendNextInTx(this.sink, this.memo)
    this.active && this.ended && sendEndInTx(this.sink)
  }
}
