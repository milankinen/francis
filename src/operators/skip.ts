import { Source } from "../_core"
import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { EventStream } from "../EventStream"
import { Observable } from "../Observable"
import { Property } from "../Property"
import { Operator } from "./_base"

export function skip<T>(n: number, stream: EventStream<T>): EventStream<T>
export function skip<T>(n: number, property: Property<T>): Property<T>
export function skip<T>(n: number, observable: Observable<T>): Observable<T>
export function skip<T>(n: number, observable: Observable<T>): Observable<T> {
  return makeObservable(observable, new Skip(observable.src, n))
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
