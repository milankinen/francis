import { Accum } from "../_interfaces"
import { curry3 } from "../_util"
import { Observable } from "../Observable"
import { Property } from "../Property"
import { last } from "./last"
import { scan } from "./scan"

export interface FoldOp {
  <S, T>(seed: S, acc: Accum<S, T>, observable: Observable<T>): Property<S>
  <S, T>(seed: S): (acc: Accum<S, T>, observable: Observable<T>) => Property<S>
  <S, T>(seed: S, acc: Accum<S, T>): (observable: Observable<T>) => Property<S>
  <S, T>(seed: S): (acc: Accum<S, T>) => (observable: Observable<T>) => Property<S>
}

export const fold: FoldOp = curry3(_fold)

function _fold<S, T>(seed: S, acc: Accum<S, T>, observable: Observable<T>): Property<S> {
  return last(scan(seed, acc, observable))
}
