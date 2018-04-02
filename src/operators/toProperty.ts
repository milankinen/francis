import { __DEVBUILD__, assert } from "../_assert"
import { sendRootNoInitial, Source, Subscriber, Subscription } from "../_core"
import { makeProperty } from "../_obs"
import { Transaction } from "../_tx"
import { Observable } from "../Observable"
import { isProperty, Property } from "../Property"
import { Scheduler, Task } from "../scheduler/index"
import { Operator } from "./_base"

export function toProperty<T>(observable: Observable<T>): Property<T> {
  return isProperty<T>(observable) ? observable : makeProperty(new ToProperty(observable.op))
}

class ToProperty<T> extends Operator<T, T> {
  public has: boolean = false

  constructor(source: Source<T>) {
    super(source, true)
    if (__DEVBUILD__) {
      assert(!source.sync, "Can't call toProperty for Property")
    }
  }

  public noinitial(tx: Transaction): void {
    this.has = true
    this.dispatcher.noinitial(tx)
  }

  public initial(tx: Transaction, val: T): void {
    this.has = true
    this.dispatcher.initial(tx, val)
  }

  public next(tx: Transaction, val: T): void {
    if (!this.has) {
      this.has = true
      this.dispatcher.noinitial(tx)
      this.isActive() && this.dispatcher.next(tx, val)
    } else {
      this.dispatcher.next(tx, val)
    }
  }

  public error(tx: Transaction, err: Error): void {
    if (!this.has) {
      this.has = true
      this.dispatcher.noinitial(tx)
      this.isActive() && this.dispatcher.error(tx, err)
    } else {
      this.dispatcher.error(tx, err)
    }
  }

  public end(tx: Transaction): void {
    if (!this.has) {
      this.has = true
      this.dispatcher.noinitial(tx)
      this.isActive() && this.dispatcher.end(tx)
    } else {
      this.dispatcher.end(tx)
    }
  }

  protected handleActivation(
    scheduler: Scheduler,
    subscriber: Subscriber<T>,
    order: number,
  ): Subscription {
    // ToProperty operator is used together with PropertyDispactcher which means that property's state
    // gets always replayed for late subscribers, including no-initial event. Hence we only need to ensure
    // that no-initial event gets dispatched for first-time subscriber (= activation). However, ToProperty
    // might be called from the inner activation context (= flatMap***) which means that it might get events
    // synchronously - that's why we need to keep track that no events have been emitted before we can
    // safely emit no-initial to the downstram
    scheduler.schedulePropertyActivation(new EnsureSyncEmitTask(this, subscriber))
    return this.activate(scheduler, subscriber, order)
  }
}

class EnsureSyncEmitTask<T> implements Task {
  constructor(private tp: ToProperty<T>, private subscriber: Subscriber<T>) {}
  public run(): void {
    if (!this.tp.has && this.subscriber.isActive()) {
      this.tp.has = true
      sendRootNoInitial(this.subscriber)
    }
  }
}
