import { In, Out } from "../_interfaces"
import { take } from "./take"

/**
 *
 * @param observable
 *
 * @public
 * @endomorphic
 */
export function first<ObsType, ValueType>(
  observable: In<ObsType, ValueType>,
): Out<ObsType, ValueType> {
  return take(1, observable)
}
