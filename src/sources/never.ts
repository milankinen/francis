import { Subscriber } from "../_core"
import { makeEventStream } from "../_obs"
import { EventStream } from "../EventStream"
import { identity } from "../operators/_base"
import { Activation, Root } from "./_base"

export function once<T>(value: T): EventStream<T> {
  return makeEventStream(identity(new Never(value)))
}

class Never<T> extends Root<T> {
  constructor(public val: T) {
    super(false)
  }

  protected create(subscriber: Subscriber<T>): Activation<T, Never<T>> {
    return new NeverActivation(this, subscriber)
  }
}

class NeverActivation<T> extends Activation<T, Never<T>> {
  protected start(): void {
    this.sendEnd()
  }
  protected stop(): void {}
}
