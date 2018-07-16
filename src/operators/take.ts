import {
  invoke,
  Invokeable,
  NOOP_SUBSCRIPTION,
  sendRootEnd,
  Source,
  Subscriber,
  Subscription,
} from "../_core"
import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { EventStream } from "../EventStream"
import { Observable } from "../Observable"
import { isProperty, Property } from "../Property"
import { schedulePropertyActivation, Scheduler, scheduleStreamActivation } from "../scheduler/index"
import { Operator } from "./_base"

export function take<T>(n: number, stream: EventStream<T>): EventStream<T>
export function take<T>(n: number, property: Property<T>): Property<T>
export function take<T>(n: number, observable: Observable<T>): Observable<T>
export function take<T>(n: number, observable: Observable<T>): Observable<T> {
  return makeObservable(observable, new Take(observable.src, n, isProperty(observable)))
}

class Take<T> extends Operator<T, T> implements Invokeable<undefined> {
  constructor(source: Source<T>, private n: number, private isProp: boolean) {
    super(source)
  }

  public next(tx: Transaction, val: T): void {
    const n = --this.n
    this.sink.next(tx, val)
    n === 0 && this.sink.end(tx)
  }

  public invoke(): void {
    if (this.sink.begin()) {
      sendRootEnd(this.sink)
    }
  }

  public subscribe(scheduler: Scheduler, subscriber: Subscriber<T>, order: number): Subscription {
    if (this.n === 0) {
      const schedule = this.isProp ? schedulePropertyActivation : scheduleStreamActivation
      schedule(scheduler, invoke(this))
      this.init(subscriber, order, NOOP_SUBSCRIPTION)
      return this
    } else {
      return super.subscribe(scheduler, subscriber, order)
    }
  }
}
