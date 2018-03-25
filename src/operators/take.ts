import { sendRootEnd, Source, Subscriber, Subscription } from "../_core"
import { Transaction } from "../_tx"
import { EventStream } from "../EventStream"
import { Observable } from "../Observable"
import { derive, Property } from "../Property"
import { Scheduler } from "../scheduler/index"
import { Operator } from "./_base"

export function take<T>(n: number, stream: EventStream<T>): EventStream<T>
export function take<T>(n: number, property: Property<T>): Property<T>
export function take<T>(n: number, observable: Observable<T>): Observable<T> {
  return _take(n, observable)
}

export function _take<T>(n: number, observable: Observable<T>): Observable<T> {
  return derive(observable, new Take(observable.op, n))
}

class Take<T> extends Operator<T, T> {
  constructor(source: Source<T>, private n: number) {
    super(source)
  }

  public initial(tx: Transaction, val: T): void {
    this.next.initial(tx, val)
    --this.n === 0 && this.next.end(tx)
  }

  public event(tx: Transaction, val: T): void {
    this.next.event(tx, val)
    --this.n === 0 && this.next.end(tx)
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
      : this.activateFirst(scheduler, subscriber, order)
  }

  protected handleMulticast(
    scheduler: Scheduler,
    subscriber: Subscriber<T>,
    order: number,
  ): Subscription {
    return this.n === 0
      ? this.abort(scheduler, subscriber, order)
      : this.activateLate(scheduler, subscriber, order)
  }
}
