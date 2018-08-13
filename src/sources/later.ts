import { EventStream } from "../EventStream"
import { sequentially } from "./sequentially"

export function later<T>(delay: number, value: T): EventStream<T>
export function later(delay: number): EventStream<undefined>
export function later<T>(delay: number, value?: T): EventStream<any> {
  return _later(delay, value)
}

export function _later<T>(delay: number, value: T): EventStream<T> {
  return sequentially(delay, [value])
}
