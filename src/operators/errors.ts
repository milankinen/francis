import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { dispatcherOf, Observable } from "../Observable"
import { Operator } from "./_base"

export function errors<T>(observable: Observable<T>): Observable<T> {
  return makeObservable(observable, new Errors(dispatcherOf(observable)))
}

class Errors<T> extends Operator<T, T> {
  public next(tx: Transaction, val: T): void {}
}
