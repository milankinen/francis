import { checkObservable } from "../_check"
import { InvokeableWithParam, invokeWith, Source, Subscriber, Subscription } from "../_core"
import { makeEventStream } from "../_obs"
import { EventStream, isEventStream } from "../EventStream"
import { dispatcherOf, Observable } from "../Observable"
import { Property } from "../Property"
import { scheduleActivationTask } from "../scheduler/index"
import { Identity } from "./_base"

export function toEventStream<ValueType>(
  observable: Observable<ValueType>,
): EventStream<ValueType> {
  checkObservable(observable)
  return isEventStream<ValueType>(observable)
    ? observable
    : makeEventStream(new ToEventStream(dispatcherOf(observable as Property<ValueType>)))
}

export class ToEventStream<T> extends Identity<T> {
  constructor(source: Source<T>) {
    super(source)
  }

  public subscribe(subscriber: Subscriber<T>, order: number): Subscription {
    return new ToEventStreamSubscription(this, super.subscribe(subscriber, order))
  }

  public activate(initialNeeded: boolean): void {
    if (this.active) {
      this.subs.activate(initialNeeded)
    }
  }
}

class ToEventStreamSubscription<T> implements Subscription, InvokeableWithParam<boolean> {
  private d: boolean = false

  constructor(private tos: ToEventStream<T>, private s: Subscription) {}

  public activate(initialNeeded: boolean): void {
    scheduleActivationTask(invokeWith(this, initialNeeded))
  }

  public invoke(initialNeeded: boolean): void {
    !this.d && this.tos.activate(initialNeeded)
  }

  public dispose(): void {
    this.d = true
    this.s.dispose()
  }

  public reorder(order: number): void {
    this.s.reorder(order)
  }
}
