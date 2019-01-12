import { invoke, Invokeable, NOOP_SUBSCRIBER, sendEndInTx, Subscriber, Subscription } from "./_core"
import { Dispatcher } from "./_dispatcher"
import { Subscribe } from "./_interfaces"
import { Transaction } from "./_tx"
import { is } from "./_util"
import { Observable } from "./Observable"
import { scheduleActivationTask } from "./scheduler/index"
import { FromBinder } from "./sources/_binder"

export class EventStream<A> extends Observable<A> {
  constructor(dispatcherOrSubscribe: EventStreamDispatcher<A> | Subscribe<A>) {
    super(
      dispatcherOrSubscribe instanceof EventStreamDispatcher
        ? dispatcherOrSubscribe
        : dispatcherFromSubscribe(dispatcherOrSubscribe),
    )
  }
}

export function isEventStream<T>(x: any): x is EventStream<T> {
  return is(x, EventStream)
}

export class EventStreamDispatcher<T> extends Dispatcher<T> {
  private ended: boolean = false

  public subscribe(subscriber: Subscriber<T>, order: number): Subscription {
    return this.ended ? new StreamEndedSubscription(subscriber) : super.subscribe(subscriber, order)
  }

  public end(tx: Transaction): void {
    this.ended = true
    this.sink.end(tx)
  }
}

function dispatcherFromSubscribe<T>(subscribe: Subscribe<T>): EventStreamDispatcher<T> {
  return new EventStreamDispatcher(new FromBinder(subscribe))
}

class StreamEndedSubscription implements Subscription, Invokeable<undefined> {
  constructor(private s: Subscriber<any>) {}

  public activate(initialNeeded: boolean): void {
    scheduleActivationTask(invoke(this))
  }

  public dispose(): void {
    this.s = NOOP_SUBSCRIBER
  }

  public reorder(order: number): void {
    // noop
  }

  public invoke(): void {
    sendEndInTx(this.s)
  }
}
