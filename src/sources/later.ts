import { curry2 } from "../_util"
import { EventStream } from "../EventStream"
import { sequentially } from "./sequentially"

export interface LaterOp {
  <T>(delay: number, value: T): EventStream<T>
  (delay: number): <T>(value: T) => EventStream<T>
}

export const later: LaterOp = curry2(_later)

function _later<T>(delay: number, value: T): EventStream<T> {
  return sequentially(delay, [value])
}
