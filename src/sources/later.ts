import { __DEVBUILD__, assert } from "../_assert"
import { EventStream } from "../EventStream"
import { sequentially } from "./sequentially"

export function later<T>(delay: number, value: T): EventStream<T>
export function later(delay: number): EventStream<undefined>
export function later<T>(delay: number, value?: T): EventStream<any> {
  if (__DEVBUILD__) {
    assert(
      arguments.length > 0 && typeof delay === "number",
      "Delay must be defined and it must be a number",
    )
  }
  return _later(delay, value)
}

export function _later<T>(delay: number, value: T): EventStream<T> {
  return sequentially(delay, [value])
}
