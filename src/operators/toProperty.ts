import { checkObservable } from "../_check"
import { makeProperty } from "../_obs"
import { curry2 } from "../_util"
import { dispatcherOf, Observable } from "../Observable"
import { isProperty, Property } from "../Property"
import { _startWithP } from "./startWith"

export const toPropertyWith: CurriedToPropertyWith = curry2(_toPropertyWith)
export interface CurriedToPropertyWith {
  <ValueType>(initial: ValueType, observable: Observable<ValueType>): Property<ValueType>
  <ValueType>(initial: ValueType): (observable: Observable<ValueType>) => Property<ValueType>
}

export function toProperty<ValueType>(observable: Observable<ValueType>): Property<ValueType> {
  checkObservable(observable)
  return isProperty<ValueType>(observable) ? observable : makeProperty(dispatcherOf(observable))
}

function _toPropertyWith<T>(initial: T, observable: Observable<T>): Property<T> {
  checkObservable(observable)
  return _startWithP(initial, toProperty(observable))
}
