import { checkProperty } from "../_check"
import { InvokeableWithParam, invokeWith, Subscriber, Subscription } from "../_core"
import { makeEventStream } from "../_obs"
import { Transaction } from "../_tx"
import { EventStream } from "../EventStream"
import { dispatcherOf } from "../Observable"
import { Property } from "../Property"
import { scheduleActivationTask } from "../scheduler/index"
import { Changes } from "./_changes"

export function changes<ValueType>(property: Property<ValueType>): EventStream<ValueType> {
  checkProperty(property)
  return makeEventStream(new ChangesAsEventStream(dispatcherOf(property)))
}

class ChangesAsEventStream<T> extends Changes<T> {
  public subscribe(subscriber: Subscriber<T>, order: number): Subscription {
    return new ChangesSubscription(this, super.subscribe(subscriber, order))
  }

  public nextInitial(tx: Transaction, val: T): void {
    // skip initial property value
  }

  public nextChange(tx: Transaction, val: T): void {
    this.sink.next(tx, val)
  }
}

class ChangesSubscription<T> implements Subscription, InvokeableWithParam<boolean> {
  private d: boolean = false
  constructor(private c: ChangesAsEventStream<T>, private s: Subscription) {}

  public activate(initialNeeded: boolean): void {
    scheduleActivationTask(invokeWith(this, initialNeeded))
  }

  public invoke(initialNeeded: boolean): void {
    !this.d && this.c.activate(initialNeeded)
  }

  public dispose(): void {
    this.d = true
    this.s.dispose()
  }

  public reorder(order: number): void {
    this.s.reorder(order)
  }
}
