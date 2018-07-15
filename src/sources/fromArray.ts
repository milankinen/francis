import { Subscriber } from "../_core"
import { makeEventStream } from "../_obs"
import { EventStream } from "../EventStream"
import { identity } from "../operators/_base"
import { Activation, Root } from "./_base"

export function fromArray<T>(events: T[]): EventStream<T> {
  return makeEventStream(identity(new FromArray(events)))
}

class FromArray<T> extends Root<T> {
  public i: number = 0
  constructor(public items: T[]) {
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
