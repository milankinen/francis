import { invoke, Invokeable, NOOP_SUBSCRIBER, sendEndInTx, Subscriber, Subscription } from "./_core"
import { Dispatcher } from "./_dispatcher"
import { Transaction } from "./_tx"
import { is } from "./_util"
import { Observable } from "./Observable"
import { scheduleActivationTask } from "./scheduler/index"

export class EventStream<A> extends Observable<A> {
  constructor(d: EventStreamDispatcher<A>) {
    super(d)
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
