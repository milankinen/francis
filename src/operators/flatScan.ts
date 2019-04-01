import { checkFunction } from "../_check"
import { FlatAccum } from "../_interfaces"
import { toObs } from "../_interrop"
import { curry3, pipe } from "../_util"
import { Observable } from "../Observable"
import { Property } from "../Property"
import { doAction } from "./do"
import { flatMapConcat } from "./flatMap"
import { toPropertyWith } from "./toProperty"

export const flatScan: CurriedFlatScan = curry3(_flatScan)
export interface CurriedFlatScan {
  <StateType, ValueType>(
    seed: StateType,
    acc: FlatAccum<StateType, ValueType>,
    observable: Observable<ValueType>,
  ): Property<StateType>
  <StateType, ValueType>(seed: StateType, acc: FlatAccum<StateType, ValueType>): (
    observable: Observable<ValueType>,
  ) => Property<StateType>
  <StateType, ValueType>(seed: StateType): (
    acc: FlatAccum<StateType, ValueType>,
    observable: Observable<ValueType>,
  ) => Property<StateType>
  <StateType, ValueType>(seed: StateType): (
    acc: FlatAccum<StateType, ValueType>,
  ) => (observable: Observable<ValueType>) => Property<StateType>
}

function _flatScan<S, T>(seed: S, acc: FlatAccum<S, T>, observable: Observable<T>): Property<S> {
  checkFunction(acc)
  let s = seed
  // prettier-ignore
  return pipe(observable,
    flatMapConcat(x => doAction(a => s = a, toObs<S, Observable<S>>(acc(s, x)))),
    toPropertyWith(seed)
  )
}
