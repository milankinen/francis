import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { EventStream } from "../EventStream"
import { Observable } from "../Observable"
import { Property } from "../Property"
import { Identity } from "./_base"

export function skipErrors<T>(observable: Property<T>): Property<T>
export function skipErrors<T>(observable: EventStream<T>): EventStream<T>
export function skipErrors<T>(observable: Observable<T>): Observable<T>
export function skipErrors<T>(observable: Observable<T>): Observable<T> {
  return makeObservable(observable, new SkipErrors(observable.src))
}

class SkipErrors<T> extends Identity<T> {
  public error(tx: Transaction, err: Error): void {}
}
