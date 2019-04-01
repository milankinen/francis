import { checkFunction } from "../_check"
import { Source } from "../_core"
import { In, Out } from "../_interfaces"
import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { curry3 } from "../_util"
import { dispatcherOf, Observable } from "../Observable"
import { Sliding } from "./slidingWindow"

export type Delta<ValueType, DeltaType> = (a: ValueType, b: ValueType) => DeltaType

export const diff: CurriedDiff = curry3(_diff)
export interface CurriedDiff {
  <ObsType, ValueType, DeltaType>(
    f: Delta<ValueType, DeltaType>,
    start: ValueType,
    observable: In<ObsType, ValueType>,
  ): Out<ObsType, DeltaType>
  <ValueType, DeltaType>(f: Delta<ValueType, DeltaType>): <ObsType>(
    start: ValueType,
    observable: In<ObsType, ValueType>,
  ) => Out<ObsType, DeltaType>
  <ValueType, DeltaType>(f: Delta<ValueType, DeltaType>, start: ValueType): <ObsType>(
    observable: In<ObsType, ValueType>,
  ) => Out<ObsType, DeltaType>
  <ValueType, DeltaType>(f: Delta<ValueType, DeltaType>): (
    start: ValueType,
  ) => <ObsType>(observable: In<ObsType, ValueType>) => Out<ObsType, DeltaType>
}

function _diff<T, D>(f: Delta<T, D>, start: T, observable: Observable<T>): Observable<D> {
  checkFunction(f)
  return makeObservable(observable, new Diff(dispatcherOf(observable), f, start))
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
