import { isFunction } from "util"
import { noop } from "../_util"
import { End, Error } from "../Event"
import { EventStream } from "../EventStream"
import { fromBinder } from "./fromBinder"

/**
 * Returns a single-value EventStream from the given promise. If promise is rejected,
 * an error event will be emitted instead of value.
 *
 * @param promise Promise to follow
 * @param abort Optional flag whether or not to call `promise.abort` if all subscribers
 * have been removed from the created stream.
 *
 * @example
 *
 * const response = F.fromPromise(fetch("/my-api.json"))
 *
 * @public
 */
export function fromPromise<ValueType>(
  promise: Promise<ValueType>,
  abort?: boolean,
): EventStream<ValueType> {
  return fromBinder<ValueType>(sink => {
    const result = promise.then(
      value => {
        sink(value)
        sink(new End())
      },
      error => {
        sink(new Error(error))
        sink(new End())
      },
    )
    if (isFunction((result as any).done)) {
      // tslint:disable-next-line:semicolon whitespace align
      ;(result as any).done()
    }
    return abort === true && isFunction((promise as any).abort)
      ? () => {
          // tslint:disable-next-line:semicolon whitespace align
          ;(promise as any).abort()
        }
      : noop
  })
}
