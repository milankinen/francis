import { FlatAccum } from "../_interfaces"
import { toObs } from "../_interrop"
import { curry3, pipe } from "../_util"
import { Observable } from "../Observable"
import { Property } from "../Property"
import { doAction } from "./do"
import { flatMapConcat } from "./flatMap"
import { toPropertyWith } from "./toProperty"

export interface FlatScanOp {
  <S, T>(seed: S, acc: FlatAccum<S, T>, observable: Observable<T>): Property<S>
  <S, T>(seed: S, acc: FlatAccum<S, T>): (observable: Observable<T>) => Property<S>
  <S, T>(seed: S): (acc: FlatAccum<S, T>, observable: Observable<T>) => Property<S>
  <S, T>(seed: S): (acc: FlatAccum<S, T>) => (observable: Observable<T>) => Property<S>
}

export const flatScan: FlatScanOp = curry3(_flatScan)

function _flatScan<S, T>(seed: S, acc: FlatAccum<S, T>, observable: Observable<T>): Property<S> {
  let s = seed
  // prettier-ignore
  return pipe(observable,
    flatMapConcat(x => doAction(a => s = a, toObs<S, Observable<S>>(acc(s, x)))),
    toPropertyWith(seed)
  )
}
