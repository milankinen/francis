import { checkNaturalInt, checkObservable, checkPositiveInt } from "../_check"
import { Source } from "../_core"
import { makeProperty } from "../_obs"
import { Transaction } from "../_tx"
import { curry3 } from "../_util"
import { dispatcherOf, Observable } from "../Observable"
import { Property } from "../Property"
import { Operator } from "./_base"
import { toPropertyWith } from "./toProperty"

export const slidingWindow: CurriedSlidingWindow = curry3(_slidingWindow)
export interface CurriedSlidingWindow {
  <ValueType>(min: number, max: number, observable: Observable<ValueType>): Property<ValueType[]>
  (min: number): <ValueType>(
    max: number,
    observable: Observable<ValueType>,
  ) => Property<ValueType[]>
  (min: number, max: number): <ValueType>(
    observable: Observable<ValueType>,
  ) => Property<ValueType[]>
  (min: number): (
    max: number,
  ) => <ValueType>(observable: Observable<ValueType>) => Property<ValueType[]>
}

function _slidingWindow<T>(min: number, max: number, observable: Observable<T>): Property<T[]> {
  checkObservable(observable)
  checkNaturalInt(min)
  checkPositiveInt(max)
  const sliding = makeProperty(new SlidingWindow(dispatcherOf(observable), min, max, []))
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
