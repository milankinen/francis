import { sendRootEnd, sendRootEvent, Subscriber } from "../_core"
import { EventStream } from "../EventStream"
import { Activation, ActivationState, root } from "./_stream"

export function fromArray<T>(events: T[]): EventStream<T> {
  return root(new FromArray(events))
}

class FromArray<T> implements Activation<T> {
  private _i: number
  constructor(private _items: T[]) {
    this._i = 0
  }
  public run(subscriber: Subscriber<T>, state: ActivationState): void {
    const items = this._items
    const n = items.length
    let i = this._i
    for (; i < n && state.running; i++) {
      sendRootEvent(subscriber, items[i])
    }
    this._i = i
    if (state.running === true) {
      sendRootEnd(subscriber)
    }
  }
}
