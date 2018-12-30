import { checkFunction } from "../_check"
import { AnyEvent, AsyncCallback, AsyncNodeCallback } from "../_interfaces"
import * as Event from "../Event"
import { EventStream } from "../EventStream"
import { fromBinder } from "./fromBinder"

/**
 * Creates an EventStream from a function that accepts a callback. The function
 * is supposed to call its callback just once.
 *
 * @param f - Function that gets called at the stream activation
 *
 * @example
 *
 * const resultStream = F.fromCallback(cb => {
 *   callSomeLongTask(result => {
 *     cb(processResult(result))
 *   })
 * })
 *
 * @public
 */
export function fromCallback<ValueType>(f: AsyncCallback<ValueType>): EventStream<ValueType> {
  checkFunction(f)
  return fromBinder<ValueType>(sink => {
    const callback = (result: ValueType | AnyEvent<ValueType>) => {
      sink([result, new Event.End()])
    }
    f(callback)
  })
}

/**
 * Behaves the same way as `fromCallback`, except that it expects the callback
 * to be called in the Node.js convention: `callback(error, data)`, where error is
 * `null` if everything is fine.
 *
 * @param f - Function that gets called at the stream activation
 * @see fromCallback
 *
 * @example
 *
 * const fileContent = F.fromNodeCallback(cb => {
 *   fs.readFile("myFile.txt", cb)
 * })
 *
 * @public
 */
export function fromNodeCallback<ValueType>(
  f: AsyncNodeCallback<ValueType>,
): EventStream<ValueType> {
  checkFunction(f)
  return fromBinder<ValueType>(sink => {
    const callback = (error: Error | null, result?: ValueType | AnyEvent<ValueType>) => {
      sink([error !== null ? new Event.Error(error) : (result as any), new Event.End()])
    }
    f(callback)
  })
}
