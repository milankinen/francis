import { Source } from "../_core"
import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { EventStream } from "../EventStream"
import { Observable } from "../Observable"
import { Property } from "../Property"
import { Sliding } from "./slidingWindow"

export type Delta<T, D> = (a: T, b: T) => D

export function diff<T, D>(f: Delta<T, D>, start: T, observable: Property<T>): Property<D>
export function diff<T, D>(f: Delta<T, D>, start: T, observable: EventStream<T>): EventStream<D>
export function diff<T, D>(f: Delta<T, D>, start: T, observable: Observable<T>): Observable<D>
export function diff<T, D>(f: Delta<T, D>, start: T, observable: Observable<T>): Observable<D> {
  return makeObservable(observable, new Diff(observable.src, f, start))
}

class Diff<T, D> extends Sliding<T, D> {
  constructor(source: Source<T>, private d: Delta<T, D>, start: T) {
    super(source, 2, 2, [start])
  }

  protected nextWin(tx: Transaction, [a, b]: T[]): void {
    const { d } = this
    this.sink.next(tx, d(a, b))
  }
}
