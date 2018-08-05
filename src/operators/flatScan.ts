import { FlatAccum } from "../_interfaces"
import { toObservable } from "../_interrop"
import { Observable } from "../Observable"
import { Property } from "../Property"
import { doAction } from "./do"
import { flatMapConcat } from "./flatMap"
import { startWith } from "./startWith"
import { toProperty } from "./toProperty"

export function flatScan<S, T>(
  seed: S,
  acc: FlatAccum<S, T>,
  observable: Observable<T>,
): Property<S> {
  let s = seed
  return startWith(
    seed,
    toProperty(
      flatMapConcat(
        t =>
          doAction(a => {
            s = a
          }, toObservable<S, Observable<S>>(acc(s, t))),
        observable,
      ),
    ),
  )
}
