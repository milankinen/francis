import { checkFunction } from "../_check"
import { Subscribe } from "../_interfaces"
import { makeEventStream } from "../_obs"
import { EventStream } from "../EventStream"
import { FromBinder } from "./_binder"

/**
 * Creates an EventStream that calls the given `subscribe` function
 * at the stream activation and starts emitting values provided by the `subscribe`
 * function.
 *
 * When the last subscriber unsubscribes from this stream, subscriber function
 * gets disposed and the (optional) disposer function gets called.
 *
 * @param subscribe - Subscriber function that is called at the stream activation
 * @see Subscribe
 *
 * @example
 *
 * const events = F.fromBinder(sink => {
 *   sink("Hello")
 *   sink(new F.Error("oops"))
 *   const id = setTimeout(() => sink("world!"), 1000)
 *   return () => {
 *     clearTimeout(id)
 *   }
 * })
 *
 * @public
 */
export function fromBinder<ValueType>(subscribe: Subscribe<ValueType>): EventStream<ValueType> {
  checkFunction(subscribe)
  return makeEventStream(new FromBinder(subscribe))
}
