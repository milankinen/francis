import { __DEVBUILD__, assert } from "../_assert"
import { Source, Subscriber, Subscription } from "../_core"
import { makeProperty } from "../_obs"
import { Transaction } from "../_tx"
import { Observable } from "../Observable"
import { isProperty, Property } from "../Property"
import { Scheduler } from "../scheduler/index"
import { Operator, SendNoInitialTask } from "./_base"

export function toProperty<T>(observable: Observable<T>): Property<T> {
  return isProperty<T>(observable) ? observable : makeProperty(new ToProperty(observable.op))
}

class ToProperty<T> extends Operator<T, T> {
  constructor(source: Source<T>) {
    super(source, true)
    if (__DEVBUILD__) {
      assert(!source.sync, "Can't call toProperty for Property")
    }
  }

  public initial(tx: Transaction, val: T): void {
    this.dispatcher.initial(tx, val)
  }

  public next(tx: Transaction, val: T): void {
    this.dispatcher.next(tx, val)
  }

  protected handleActivation(
    scheduler: Scheduler,
    subscriber: Subscriber<T>,
    order: number,
  ): Subscription {
    scheduler.schedulePropertyActivation(new SendNoInitialTask(subscriber))
    return this.activate(scheduler, subscriber, order)
  }

  protected handleMulticast(
    scheduler: Scheduler,
    subscriber: Subscriber<T>,
    order: number,
  ): Subscription {
    scheduler.schedulePropertyActivation(new SendNoInitialTask(subscriber))
    return this.multicast(scheduler, subscriber, order)
  }
}
