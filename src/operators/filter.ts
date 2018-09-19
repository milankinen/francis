import { checkFunctionOrProperty } from "../_check"
import { Source } from "../_core"
import { Predicate } from "../_interfaces"
import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { curry2 } from "../_util"
import { dispatcherOf, Observable } from "../Observable"
import { isProperty, Property } from "../Property"
import { Operator } from "./_base"
import { sampleWith } from "./sample"

export interface FilterOp {
  <T>(predicate: Predicate<T> | Property<any>, observable: Observable<T>): Observable<T>
  <T>(predicate: Predicate<T> | Property<any>): (observable: Observable<T>) => Observable<T>
}

export const filter: FilterOp = curry2(_filter)

function _filter<T>(
  predicate: Predicate<T> | Property<any>,
  observable: Observable<T>,
): Observable<T> {
  checkFunctionOrProperty(predicate)
  const op: Operator<any, T> = isProperty<any>(predicate)
    ? new FilterSampled(dispatcherOf(sampleWith(observable, (v, s) => [v, s], predicate)))
    : new Filter(dispatcherOf(observable), predicate)
  return makeObservable(observable, op)
}

class Filter<T> extends Operator<T, T> {
  constructor(source: Source<T>, private p: Predicate<T>) {
    super(source)
  }

  public next(tx: Transaction, val: T): void {
    const predicate = this.p
    predicate(val) && this.sink.next(tx, val)
  }
}

class FilterSampled<T> extends Operator<[any, T], T> {
  constructor(source: Source<[any, T]>) {
    super(source)
  }

  public next(tx: Transaction, sampledVal: [any, T]): void {
    const [tested, val] = sampledVal
    tested && this.sink.next(tx, val)
  }
}
