import { sendRootEnd, sendRootEvent, Subscriber } from "../_core"
import { EventStream } from "../EventStream"
import { Activation, ActivationState, root } from "./_stream"

export function once<T>(value: T): EventStream<T> {
  return root(new Once(value))
}

class Once<T> implements Activation<T> {
  private _val: T
  private _sent: boolean

  constructor(value: T) {
    this._sent = false
    this._val = value
  }

  public run(subscriber: Subscriber<T>, state: ActivationState): void {
    if (state.running && !this._sent) {
      this._sent = true
      sendRootEvent(subscriber, this._val)
    }
    if (state.running) {
      sendRootEnd(subscriber)
    }
  }
}
