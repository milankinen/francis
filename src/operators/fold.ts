import { Accum } from "../_interfaces"
import { curry3 } from "../_util"
import { Observable } from "../Observable"
import { Property } from "../Property"
import { last } from "./last"
import { scan } from "./scan"

export const fold: CurriedFold = curry3(_fold)
export interface CurriedFold {
  <StateType, ValueType>(
    seed: StateType,
    acc: Accum<StateType, ValueType>,
    observable: Observable<ValueType>,
  ): Property<StateType>
  <StateType>(seed: StateType): <ValueType>(
    acc: Accum<StateType, ValueType>,
    observable: Observable<ValueType>,
  ) => Property<StateType>
  <StateType, ValueType>(seed: StateType, acc: Accum<StateType, ValueType>): (
    observable: Observable<ValueType>,
  ) => Property<StateType>
  <StateType>(seed: StateType): <ValueType>(
    acc: Accum<StateType, ValueType>,
  ) => (observable: Observable<ValueType>) => Property<StateType>
}

function _fold<S, T>(seed: S, acc: Accum<S, T>, observable: Observable<T>): Property<S> {
  return last(scan(seed, acc, observable))
}
