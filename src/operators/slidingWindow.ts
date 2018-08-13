import { checkNaturalInt, checkObservable, checkPositiveInt } from "../_check"
import { Source } from "../_core"
import { makeProperty } from "../_obs"
import { Transaction } from "../_tx"
import { curry3 } from "../_util"
import { Observable } from "../Observable"
import { Property } from "../Property"
import { Operator } from "./_base"
import { toPropertyWith } from "./toProperty"

export interface SlidingWindowOp {
  <T>(min: number, max: number, observable: Observable<T>): Property<T[]>
  <T>(min: number): (max: number, observable: Observable<T>) => Property<T[]>
  <T>(min: number, max: number): (observable: Observable<T>) => Property<T[]>
  <T>(min: number): (max: number) => (observable: Observable<T>) => Property<T[]>
}

export const slidingWindow: SlidingWindowOp = curry3(_slidingWindow)

function _slidingWindow<T>(min: number, max: number, observable: Observable<T>): Property<T[]> {
  checkObservable(observable)
  checkNaturalInt(min)
  checkPositiveInt(max)
  const sliding = makeProperty(new SlidingWindow(observable.src, min, max, []))
  return min > 0 ? sliding : toPropertyWith([], sliding)
}

export abstract class Sliding<A, B> extends Operator<A, B> {
  constructor(source: Source<A>, private min: number, private max: number, private win: A[]) {
    super(source)
  }

  public next(tx: Transaction, val: A): void {
    const { win, min, max } = this
    win.push(val)
    if (win.length >= min) {
      if (win.length > max) {
        win.shift()
      }
      this.nextWin(tx, win)
    }
  }

  protected abstract nextWin(tx: Transaction, win: A[]): void
}

class SlidingWindow<T> extends Sliding<T, T[]> {
  protected nextWin(tx: Transaction, win: T[]): void {
    this.sink.next(tx, win.slice())
  }
}
