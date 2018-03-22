import { sendRootInitial, Source, Subscriber, Subscription } from "../_core"
import { Transaction } from "../_tx"
import { EventStream } from "../EventStream"
import { Property } from "../Property"
import { Scheduler, Task } from "../scheduler/index"
import { Operator } from "./_base"

export function toProperty<T>(initialValue: T, stream: EventStream<T>): Property<T> {
  return new Property(new ToProperty(stream.op, initialValue))
}

class ToProperty<T> extends Operator<T, T> {
  constructor(source: Source<T>, public initVal: T) {
    super(source)
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
    scheduler.schedulePropertyActivation(new ToPropertyActivationTask(this))
    return this.activateFirst(scheduler, subscriber, order)
  }

  protected handleMulticast(
    scheduler: Scheduler,
    subscriber: Subscriber<T>,
    order: number,
  ): Subscription {
    scheduler.schedulePropertyActivation(new ToPropertyActivationTask(this))
    return this.activateLate(scheduler, subscriber, order)
  }
}

class ToPropertyActivationTask<T> implements Task {
  constructor(private op: ToProperty<T>) {}

  public run(): void {
    // tslint:disable-next-line:no-unused-expression
    this.op.isActive() && sendRootInitial(this.op, this.op.initVal)
  }
}
