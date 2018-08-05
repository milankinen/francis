import { makeProperty } from "../_obs"
import { curry2 } from "../_util"
import { Observable } from "../Observable"
import { isProperty, Property } from "../Property"
import { identity } from "./_base"
import { _startWithP } from "./startWith"

export interface ToPropertyWithOp {
  <T>(initial: T, observable: Observable<T>): Property<T>
  <T>(initial: T): (observable: Observable<T>) => Property<T>
}

export const toPropertyWith: ToPropertyWithOp = curry2(_toPropertyWith)

export function toProperty<T>(observable: Observable<T>): Property<T> {
  return isProperty<T>(observable) ? observable : makeProperty(identity(observable.src))
}

function _toPropertyWith<T>(initial: T, observable: Observable<T>): Property<T> {
  return _startWithP(initial, toProperty(observable))
}
