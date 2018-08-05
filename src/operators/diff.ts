import { Source } from "../_core"
import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { curry3 } from "../_util"
import { Observable } from "../Observable"
import { Sliding } from "./slidingWindow"

export type Delta<T, D> = (a: T, b: T) => D

export interface DiffOp {
  <T, D>(f: Delta<T, D>, start: T, observable: Observable<T>): Observable<D>
  <T, D>(f: Delta<T, D>): (start: T, observable: Observable<T>) => Observable<D>
  <T, D>(f: Delta<T, D>, start: T): (observable: Observable<T>) => Observable<D>
  <T, D>(f: Delta<T, D>): (start: T) => (observable: Observable<T>) => Observable<D>
}

export const diff: DiffOp = curry3(_diff)

function _diff<T, D>(f: Delta<T, D>, start: T, observable: Observable<T>): Observable<D> {
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
