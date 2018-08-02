import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { EventStream } from "../EventStream"
import { Observable } from "../Observable"
import { Property } from "../Property"
import { Operator } from "./_base"

export function errors<T>(observable: Property<T>): Property<T>
export function errors<T>(observable: EventStream<T>): EventStream<T>
export function errors<T>(observable: Observable<T>): Observable<T>
export function errors<T>(observable: Observable<T>): Observable<T> {
  return makeObservable(observable, new Errors(observable.src))
}

class Errors<T> extends Operator<T, T> {
  public next(tx: Transaction, val: T): void {}
}
