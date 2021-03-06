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
import { startWith } from "./startWith"
import { takeUntil } from "./takeUntil"

export const takeWhile: CurriedTakeWhile = curry2(_takeWhile)
export interface CurriedTakeWhile {
  <ObsType, ValueType>(
    f: Predicate<ValueType> | Property<any>,
    observable: In<ObsType, ValueType>,
  ): Out<ObsType, ValueType>
  <ValueType>(f: Predicate<ValueType> | Property<any>): <ObsType>(
    observable: In<ObsType, ValueType>,
  ) => Out<ObsType, ValueType>
}

function _takeWhile<T>(
  f: Predicate<T> | Property<boolean>,
  observable: Observable<T>,
): Observable<T> {
  checkFunctionOrProperty(f)
  return isProperty(f)
    ? takeUntil(filter(x => !x, startWith(true, f)), observable)
    : makeObservable(observable, new TakeWhile(dispatcherOf(observable), f))
}

class TakeWhile<T> extends Operator<T, T> {
  constructor(src: Source<T>, private f: Predicate<T>) {
    super(src)
  }

  public next(tx: Transaction, val: T): void {
    const { f } = this
    if (!f(val)) {
      this.sink.end(tx)
    } else {
      this.sink.next(tx, val)
    }
  }
}
