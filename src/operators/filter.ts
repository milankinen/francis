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

/**
 * Filters Observable's values using the given predicate function. Supports
 * also filtering by `Property` - values are passed only when the property has
 * truthy value.
 *
 * @param predicateOrProperty Predicate function `x => boolean` or `Property` which is used to filter out value events
 * @param observable Source observable
 * @returns An `Observable` whose values pass the given predicate.
 *
 * @example
 *
 * // Filtering by predicate function
 * F.pipe(F.fromArray([1, 2, 3, 4]),
 *  F.filter(x => x % 2 === 0),
 *  F.log("Result"))
 * // logs: 2, 4, <end>
 *
 * // Filtering by Property
 * const isLoading: Property<boolean> = getLoading(document)
 * const clicksWhenNotLoading =
 *  F.pipe(F.fromEvents(document.getElementById("myButton"), "click"),
 *   F.filter(F.not(isLoading)))
 *
 * @public
 * @endomorphic
 */
export const filter: CurriedFilter = curry2(_filter)
interface CurriedFilter {
  <ValueType>(
    predicateOrProperty: Predicate<ValueType> | Property<any>,
    observable: Observable<ValueType>,
  ): Observable<ValueType>
  <ValueType>(predicateOrProperty: Predicate<ValueType> | Property<any>): (
    observable: Observable<ValueType>,
  ) => Observable<ValueType>
}

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
