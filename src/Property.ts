import {
  Invokeable,
  invokeWith,
  NONE,
  sendRootEnd,
  sendRootNext,
  Subscriber,
  Subscription,
} from "./_core"
import { Dispatcher } from "./_dispatcher"
import { Transaction } from "./_tx"
import { Observable } from "./Observable"
import { schedulePropertyActivation, Scheduler } from "./scheduler/index"

export class Property<A> extends Observable<A> {
  constructor(src: PropertyDispatcher<A>) {
    super(src)
  }
}

export function isProperty<T>(x: any): x is Property<T> {
  return x && x instanceof Property
}

export class PropertyDispatcher<T> extends Dispatcher<T> implements Invokeable<Subscriber<T>> {
  private val: T = NONE
  private ended: boolean = false

  public begin(): boolean {
    return !this.ended && this.sink.begin()
  }

  public next(tx: Transaction, val: T): void {
    this.sink.next(tx, (this.val = val))
  }

  public end(tx: Transaction): void {
    this.ended = true
    this.sink.end(tx)
  }

  // invoked when state must be replayed
  public invoke(subscriber: Subscriber<T>): void {
    const { val, ended, sink } = this
    if (this.sink.begin()) {
      val !== NONE && sendRootNext(subscriber, val)
      ended === true && sendRootEnd(sink)
    }
  }

  protected activate(scheduler: Scheduler, subscriber: Subscriber<T>, order: number): Subscription {
    const { val, ended } = this
    if (val !== NONE || ended === true) {
      schedulePropertyActivation(scheduler, invokeWith(this, subscriber))
    }
    return super.activate(scheduler, subscriber, order)
  }

  protected multicast(
    scheduler: Scheduler,
    subscriber: Subscriber<T>,
    order: number,
  ): Subscription {
    const { val, ended } = this
    if (val !== NONE || ended === true) {
      schedulePropertyActivation(scheduler, invokeWith(this, subscriber))
    }
    return super.multicast(scheduler, subscriber, order)
  }
}
