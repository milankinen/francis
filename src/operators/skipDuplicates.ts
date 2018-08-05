import { Source } from "../_core"
import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { curry2 } from "../_util"
import { EventStream } from "../EventStream"
import { Observable } from "../Observable"
import { Property } from "../Property"
import { Sliding } from "./slidingWindow"

export type Eq<T> = (a: T, b: T) => boolean

export interface SkipDuplicatesOp {
  <T>(isEqual: Eq<T>, observable: Observable<T>): Observable<T>
  <T>(isEqual: Eq<T>): (observable: Observable<T>) => Observable<T>
}

export const skipDuplicates: SkipDuplicatesOp = curry2(_skipDuplicates)

export function skipEquals<T>(observable: Property<T>): Property<T>
export function skipEquals<T>(observable: EventStream<T>): EventStream<T>
export function skipEquals<T>(observable: Observable<T>): Observable<T>
export function skipEquals<T>(observable: Observable<T>): Observable<T> {
  return _skipDuplicates((a, b) => a === b, observable)
}

function _skipDuplicates<T>(isEqual: Eq<T>, observable: Observable<T>): Observable<T> {
  return makeObservable(observable, new SkipDuplicates(observable.src, isEqual))
}

class SkipDuplicates<T> extends Sliding<T, T> {
  constructor(source: Source<T>, private eq: Eq<T>) {
    super(source, 1, 2, [])
  }

  protected nextWin(tx: Transaction, win: T[]): void {
    if (win.length === 2) {
      const { eq } = this
      const [a, b] = win
      if (!eq(a, b)) {
        this.sink.next(tx, b)
      }
    } else {
      this.sink.next(tx, win[0])
    }
  }
}
