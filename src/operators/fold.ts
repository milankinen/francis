import { Accum } from "../_interfaces"
import { Observable } from "../Observable"
import { Property } from "../Property"
import { last } from "./last"
import { scan } from "./scan"

export function fold<S, T>(seed: S, acc: Accum<S, T>, observable: Observable<T>): Property<S> {
  return last(scan(seed, acc, observable))
}
