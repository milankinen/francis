import { Subscriber } from "../_core"
import { EventStream } from "../EventStream"
import { identity } from "../operators/_base"
import { Scheduler } from "../scheduler/index"
import { Activation, Root } from "./_base"

export function once<T>(value: T): EventStream<T> {
  return new EventStream(identity(new Once(value)))
}

class Once<T> extends Root<T> {
  constructor(public val: T) {
    super(false)
  }

  protected activate(scheduler: Scheduler, subscriber: Subscriber<T>): Activation<T, Once<T>> {
    return new OnceActivation(this, subscriber)
  }
}

class OnceActivation<T> extends Activation<T, Once<T>> {
  protected start(): void {
    this.send(this.owner.val)
    this.active && this.sendEnd()
  }
  protected stop(): void {}
}
