import { checkNaturalInt } from "../_check"
import { In, Out } from "../_interfaces"
import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { curry2 } from "../_util"
import { dispatcherOf, Observable } from "../Observable"
import { Throttle, ThrottleBase } from "./throttle"

export const debounce: CurriedDebounce = curry2(_debounce)
export interface CurriedDebounce {
  <ObsType, ValueType>(delay: number, observable: In<ObsType, ValueType>): Out<ObsType, ValueType>
  (delay: number): <ObsType, ValueType>(
    observable: In<ObsType, ValueType>,
  ) => Out<ObsType, ValueType>
}

export const debounceImmediate: CurriedDebounceImmediate = curry2(_debounceImmediate)
export interface CurriedDebounceImmediate {
  <ObsType, ValueType>(delay: number, observable: In<ObsType, ValueType>): Out<ObsType, ValueType>
  (delay: number): <ObsType, ValueType>(
    observable: In<ObsType, ValueType>,
  ) => Out<ObsType, ValueType>
}

function _debounce<T>(delay: number, observable: Observable<T>): Observable<T> {
  checkNaturalInt(delay)
  return makeObservable(observable, new Debounce(dispatcherOf(observable), delay))
}

function _debounceImmediate<T>(delay: number, observable: Observable<T>): Observable<T> {
  checkNaturalInt(delay)
  return makeObservable(observable, new DebounceImmediate(dispatcherOf(observable), delay))
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
