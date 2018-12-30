import { curry2 } from "../_util"
import { EventStream } from "../EventStream"
import { sequentially } from "./sequentially"

/**
 * Creates a single-element stream that emits the given
 * value after given delay.
 *
 * @param delay - Initial delay in milliseconds
 * @param value - Value to emit
 *
 * @example
 *
 * const message = F.later(10000, "Wait for it!")
 *
 * @public
 */
export const later: CurriedLater = curry2(_later)
interface CurriedLater {
  <ValueType>(delay: number, value: ValueType): EventStream<ValueType>
  (delay: number): <ValueType>(value: ValueType) => EventStream<ValueType>
}

function _later<T>(delay: number, value: T): EventStream<T> {
  return sequentially(delay, [value])
}
