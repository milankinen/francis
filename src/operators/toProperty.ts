import { __DEVBUILD__, assert } from "../_assert"
import { Source, Subscriber, Subscription } from "../_core"
import { Transaction } from "../_tx"
import { EventStream } from "../EventStream"
import { Property } from "../Property"
import { Scheduler } from "../scheduler/index"
import { Operator, SendNoInitialTask } from "./_base"

export function toProperty<T>(stream: EventStream<T>): Property<T> {
  return new Property(new ToProperty(stream.op))
}

class ToProperty<T> extends Operator<T, T> {
  constructor(source: Source<T>) {
    super(source, true)
    if (__DEVBUILD__) {
      assert(() => !source.sync, "Can't call toProperty for Property")
    }
  }

  public initial(tx: Transaction, val: T): void {
    this.next.initial(tx, val)
  }

  public event(tx: Transaction, val: T): void {
    this.next.event(tx, val)
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
