import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { EventStream } from "../EventStream"
import { Observable } from "../Observable"
import { Property } from "../Property"
import { Throttle, ThrottleBase } from "./throttle"

export function debounce<T>(delay: number, observable: Property<T>): Property<T>
export function debounce<T>(delay: number, observable: EventStream<T>): EventStream<T>
export function debounce<T>(delay: number, observable: Observable<T>): Observable<T>
export function debounce<T>(delay: number, observable: Observable<T>): Observable<T> {
  return makeObservable(observable, new Debounce(observable.src, delay))
}

export function debounceImmediate<T>(delay: number, observable: Property<T>): Property<T>
export function debounceImmediate<T>(delay: number, observable: EventStream<T>): EventStream<T>
export function debounceImmediate<T>(delay: number, observable: Observable<T>): Observable<T>
export function debounceImmediate<T>(delay: number, observable: Observable<T>): Observable<T> {
  return makeObservable(observable, new DebounceImmediate(observable.src, delay))
}

class Debounce<T> extends Throttle<T> {
  public nextChange(tx: Transaction, val: T): void {
    this.memo = val
    this.resetTimeout()
    this.ensureTimeout()
  }
}

class DebounceImmediate<T> extends ThrottleBase<T> {
  private skip: boolean = false

  public dispose(): void {
    this.skip = false
    super.dispose()
  }

  public nextChange(tx: Transaction, val: T): void {
    if (!this.skip) {
      this.skip = true
      this.sink.next(tx, val)
    }
    if (this.active) {
      this.ensureTimeout()
    }
  }

  public due(): void {
    this.to = null
    this.skip = false
  }
}
