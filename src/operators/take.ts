import { sendRootEnd, Source, Subscriber, Subscription } from "../_core"
import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { EventStream } from "../EventStream"
import { Observable } from "../Observable"
import { Property } from "../Property"
import { Scheduler } from "../scheduler/index"
import { Operator } from "./_base"

export function take<T>(n: number, stream: EventStream<T>): EventStream<T>
export function take<T>(n: number, property: Property<T>): Property<T>
export function take<T>(n: number, observable: Observable<T>): Observable<T>
export function take<T>(n: number, observable: Observable<T>): Observable<T> {
  return makeObservable(new Take(observable.op, n))
}

class Take<T> extends Operator<T, T> {
  constructor(source: Source<T>, private n: number) {
    super(source, source.sync)
  }

  public initial(tx: Transaction, val: T): void {
    this.dispatcher.initial(tx, val)
    --this.n === 0 && this.dispatcher.end(tx)
  }

  public next(tx: Transaction, val: T): void {
    this.dispatcher.next(tx, val)
    --this.n === 0 && this.dispatcher.end(tx)
  }

  public handleAbort(subscriber: Subscriber<T>): void {
    subscriber.isActive() && sendRootEnd(subscriber)
  }

  protected handleActivation(
    scheduler: Scheduler,
    subscriber: Subscriber<T>,
    order: number,
  ): Subscription {
    return this.n === 0
      ? this.abort(scheduler, subscriber, order)
      : this.activate(scheduler, subscriber, order)
  }

  protected handleMulticast(
    scheduler: Scheduler,
    subscriber: Subscriber<T>,
    order: number,
  ): Subscription {
    return this.n === 0
      ? this.abort(scheduler, subscriber, order)
      : this.multicast(scheduler, subscriber, order)
  }
}
