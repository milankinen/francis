import { Subscriber } from "../_core"
import { makeEventStream, makeProperty } from "../_obs"
import { EventStream } from "../EventStream"
import { identity } from "../operators/_base"
import { Property } from "../Property"
import { Scheduler } from "../scheduler/index"
import { Activation, Root } from "./_base"

export function constant<T>(val: T): Property<T> {
  return makeProperty(identity(new Single(val, true)))
}

export function once<T>(val: T): EventStream<T> {
  return makeEventStream(identity(new Single(val, false)))
}

class Single<T> extends Root<T> {
  constructor(public val: T, sync: boolean) {
    super(sync)
  }

  protected activate(scheduler: Scheduler, subscriber: Subscriber<T>): Activation<T, Single<T>> {
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
