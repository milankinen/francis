import { checkNaturalInt } from "../_check"
import { Source } from "../_core"
import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { curry2 } from "../_util"
import { dispatcherOf, Observable } from "../Observable"
import { Operator } from "./_base"

export interface SkipOp {
  <T>(n: number, observable: Observable<T>): Observable<T>
  <T>(n: number): (observable: Observable<T>) => Observable<T>
}

export const skip: SkipOp = curry2(_skip)

function _skip<T>(n: number, observable: Observable<T>): Observable<T> {
  checkNaturalInt(n)
  return makeObservable(observable, new Skip(dispatcherOf(observable), n))
}

class Skip<T> extends Operator<T, T> {
  constructor(source: Source<T>, private n: number) {
    super(source)
  }

  public next(tx: Transaction, val: T): void {
    if (this.n-- <= 0) {
      this.sink.next(tx, val)
    }
  }
}
