import { NONE } from "../_core"
import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { EventStream } from "../EventStream"
import { dispatcherOf, Observable } from "../Observable"
import { Property } from "../Property"
import { Operator } from "./_base"

export function last<T>(property: Property<T>): Property<T>
export function last<T>(stream: EventStream<T>): EventStream<T>
export function last<T>(observable: Observable<T>): Observable<T>
export function last<T>(observable: Observable<T>): Observable<T> {
  return makeObservable<T>(observable, new Last(dispatcherOf(observable)))
}

class Last<T> extends Operator<T, T> {
  private val: T = NONE

  public next(tx: Transaction, val: T): void {
    this.val = val
  }

  public end(tx: Transaction): void {
    if (this.val !== NONE) {
      this.sink.next(tx, this.val)
    }
    this.sink.end(tx)
  }
}
