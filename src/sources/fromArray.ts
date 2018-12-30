import { checkArray } from "../_check"
import { Subscriber } from "../_core"
import { AnyEvent } from "../_interfaces"
import { makeEventStream } from "../_obs"
import { EventStream } from "../EventStream"
import { Activation, Root } from "./_base"

/**
 * Creates an EventStream that produces events from the given array. Once the
 * stream is activated, all events are emitted at the same tick. You can also send
 * errors by using `F.Error` event in the given array.
 *
 * @param events - Events to be emitted to the subscribers
 *
 * @example
 *
 * const events = F.fromArray(["foo", new F.Error("fail"), "bar"])
 *
 * @public
 */
export function fromArray<ValueType>(
  events: Array<ValueType | AnyEvent<ValueType>>,
): EventStream<ValueType> {
  checkArray(events)
  return makeEventStream(new FromArray(events))
}

class FromArray<T> extends Root<T> {
  public i: number = 0
  constructor(public items: Array<T | AnyEvent<T>>) {
    super(false)
  }

  protected create(subscriber: Subscriber<T>): Activation<T, FromArray<T>> {
    return new FromArrayActivation(this, subscriber)
  }
}

class FromArrayActivation<T> extends Activation<T, FromArray<T>> {
  protected start(): void {
    const owner = this.owner
    const items = owner.items
    const n = items.length
    for (; this.active && owner.i < n; ++owner.i) {
      this.send(items[owner.i])
    }
    this.active && this.sendEnd()
  }

  protected stop(): void {}
}
