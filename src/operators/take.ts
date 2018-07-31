import { EndStateAware, Source } from "../_core"
import { makeStatefulObservable } from "../_obs"
import { Transaction } from "../_tx"
import { EventStream } from "../EventStream"
import { Observable } from "../Observable"
import { Property } from "../Property"
import { Operator } from "./_base"

export function take<T>(n: number, stream: EventStream<T>): EventStream<T>
export function take<T>(n: number, property: Property<T>): Property<T>
export function take<T>(n: number, observable: Observable<T>): Observable<T>
export function take<T>(n: number, observable: Observable<T>): Observable<T> {
  return makeStatefulObservable(observable, new Take(observable.src, n))
}

class Take<T> extends Operator<T, T> implements EndStateAware {
  constructor(source: Source<T>, private n: number) {
    super(source)
  }

  public next(tx: Transaction, val: T): void {
    const n = this.n > 0 ? --this.n : 0
    this.sink.next(tx, val)
    n === 0 && this.sink.end(tx)
  }

  public isEnded(): boolean {
    return this.n === 0
  }
}
