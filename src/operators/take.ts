import { checkNaturalInt } from "../_check"
import { Source } from "../_core"
import { In, Out } from "../_interfaces"
import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { curry2 } from "../_util"
import { dispatcherOf, Observable } from "../Observable"
import { Never } from "../sources/never"
import { Operator } from "./_base"

export const take: CurriedTake = curry2(_take)
export interface CurriedTake {
  <ObsType, ValueType>(n: number, observable: In<ObsType, ValueType>): Out<ObsType, ValueType>
  (n: number): <ObsType, ValueType>(observable: In<ObsType, ValueType>) => Out<ObsType, ValueType>
}

function _take<T>(n: number, observable: Observable<T>): Observable<T> {
  checkNaturalInt(n)
  return makeObservable(observable, new Take(dispatcherOf(observable), n))
}

class Take<T> extends Operator<T, T> {
  constructor(source: Source<T>, private n: number) {
    super(n > 0 ? source : new Never())
  }

  public next(tx: Transaction, val: T): void {
    const n = this.n > 0 ? --this.n : 0
    this.sink.next(tx, val)
    n === 0 && this.sink.end(tx)
  }
}
