import { checkFunctionOrProperty } from "../_check"
import { Source } from "../_core"
import { In, Out, Predicate } from "../_interfaces"
import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { curry2 } from "../_util"
import { dispatcherOf, Observable } from "../Observable"
import { isProperty, Property } from "../Property"
import { Operator } from "./_base"
import { filter } from "./filter"
import { skipUntil } from "./skipUntil"
import { startWith } from "./startWith"

export const skipWhile: CurriedSkipWhile = curry2(_skipWhile)
export interface CurriedSkipWhile {
  <ObsType, ValueType>(
    f: Predicate<ValueType> | Property<any>,
    observable: In<ObsType, ValueType>,
  ): Out<ObsType, ValueType>
  <ValueType>(f: Predicate<ValueType> | Property<any>): <ObsType>(
    observable: In<ObsType, ValueType>,
  ) => Out<ObsType, ValueType>
}

function _skipWhile<T>(f: Predicate<T> | Property<any>, observable: Observable<T>): Observable<T> {
  checkFunctionOrProperty(f)
  return isProperty<any>(f)
    ? skipUntil(filter(x => !x, startWith(true, f)), observable)
    : makeObservable(observable, new SkipWhile(dispatcherOf(observable), f))
}

class SkipWhile<T> extends Operator<T, T> {
  private pass: boolean = false

  constructor(src: Source<T>, private f: Predicate<T>) {
    super(src)
  }

  public next(tx: Transaction, val: T): void {
    const { f } = this
    if (this.pass || (this.pass = !f(val))) {
      this.sink.next(tx, val)
    }
  }
}
