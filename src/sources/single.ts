import { Subscriber } from "../_core"
import { makeEventStream, makeProperty } from "../_obs"
import { EventStream } from "../EventStream"
import { Property } from "../Property"
import { Activation, Root } from "./_base"

/**
 * Creates a constant Property with the given value.
 *
 * @param val - Property's value
 *
 * @example
 *
 * const message = F.constant("Tsers!")
 *
 * @public
 */
export function constant<ValueType>(val: ValueType): Property<ValueType> {
  return makeProperty(new Single(val, true))
}

/**
 * Creates a single-event EventStream with the given value. Stream
 * ends immediately after the value has been emitted.
 *
 * @param val - Stream's value
 *
 * @example
 *
 * const message = F.once("Tsers!")
 *
 * @public
 */
export function once<ValueType>(val: ValueType): EventStream<ValueType> {
  return makeEventStream(new Single(val, false))
}

class Single<T> extends Root<T> {
  constructor(public val: T, sync: boolean) {
    super(sync)
  }

  protected create(subscriber: Subscriber<T>): Activation<T, Single<T>> {
    return new SingleActivation(this, subscriber)
  }
}

class SingleActivation<T> extends Activation<T, Single<T>> {
  protected start(): void {
    this.send(this.owner.val)
    this.sendEnd()
  }
  protected stop(): void {}
}
