import {
  EndStateAware,
  invoke,
  Invokeable,
  NOOP_SUBSCRIBER,
  sendEndInTx,
  Subscriber,
  Subscription,
} from "./_core"
import { Dispatcher } from "./_dispatcher"
import { Observable } from "./Observable"
import { Operator } from "./operators/_base"
import { scheduleActivationTask } from "./scheduler/index"

export class EventStream<A> extends Observable<A> {
  constructor(src: EventStreamDispatcher<A>) {
    super(src)
  }
}

export function isEventStream<T>(x: any): x is EventStream<T> {
  return x && x instanceof EventStream
}

export class EventStreamDispatcher<T> extends Dispatcher<T> {
  // EventStream does not have any special dispatching requirements
  // in addition to multicasting
}

export class StatfulEventStreamDispatcher<T> extends Dispatcher<T> {
  protected source!: Operator<any, T> & EndStateAware

  constructor(op: Operator<any, T> & EndStateAware) {
    super(op)
  }

  public subscribe(subscriber: Subscriber<T>, order: number): Subscription {
    return this.source.isEnded()
      ? new StreamEndedSubscription(subscriber)
      : super.subscribe(subscriber, order)
  }
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
