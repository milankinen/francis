import { checkFunctionOrProperty } from "../_check"
import { Source } from "../_core"
import { Predicate } from "../_interfaces"
import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { curry2 } from "../_util"
import { dispatcherOf, Observable } from "../Observable"
import { isProperty, Property } from "../Property"
import { Operator } from "./_base"
import { filter } from "./filter"
import { skipUntil } from "./skipUntil"
import { startWith } from "./startWith"

export interface SkipWhileOp {
  <T>(f: Predicate<T> | Property<boolean>, observable: Observable<T>): Observable<T>
  <T>(f: Predicate<T> | Property<boolean>): (observable: Observable<T>) => Observable<T>
}

export const skipWhile: SkipWhileOp = curry2(_skipWhile)

function _skipWhile<T>(
  f: Predicate<T> | Property<boolean>,
  observable: Observable<T>,
): Observable<T> {
  checkFunctionOrProperty(f)
  return isProperty(f)
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
