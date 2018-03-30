import { sendRootEnd, sendRootInitial, Subscriber } from "../_core"
import { makeProperty } from "../_obs"
import { identity } from "../operators/_base"
import { Property } from "../Property"
import { Scheduler } from "../scheduler/index"
import { Activation, Root } from "./_base"

export function constant<T>(val: T): Property<T> {
  return makeProperty(identity(new Constant(val)))
}

class Constant<T> extends Root<T> {
  constructor(public val: T) {
    super(true)
  }

  protected activate(scheduler: Scheduler, subscriber: Subscriber<T>): Activation<T, Constant<T>> {
    return new ConstActivation(this, subscriber)
  }
}

class ConstActivation<T> extends Activation<T, Constant<T>> {
  protected start(): void {
    sendRootInitial(this.subscriber, this.owner.val)
    this.active && sendRootEnd(this.subscriber)
  }
  protected stop(): void {}
}
