import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { curry2 } from "../_util"
import { Observable } from "../Observable"
import { Throttle, ThrottleBase } from "./throttle"

export interface DebounceOp {
  <T>(delay: number, observable: Observable<T>): Observable<T>
  <T>(delay: number): (observable: Observable<T>) => Observable<T>
}

export interface DebounceImmediateOp {
  <T>(delay: number, observable: Observable<T>): Observable<T>
  <T>(delay: number): (observable: Observable<T>) => Observable<T>
}

export const debounce: DebounceOp = curry2(_debounce)
export const debounceImmediate: DebounceImmediateOp = curry2(_debounceImmediate)

function _debounce<T>(delay: number, observable: Observable<T>): Observable<T> {
  return makeObservable(observable, new Debounce(observable.src, delay))
}

function _debounceImmediate<T>(delay: number, observable: Observable<T>): Observable<T> {
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
