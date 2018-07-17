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
import { scheduleActivationTask } from "../scheduler/index"
import { Operator } from "./_base"

export function take<T>(n: number, stream: EventStream<T>): EventStream<T>
export function take<T>(n: number, property: Property<T>): Property<T>
export function take<T>(n: number, observable: Observable<T>): Observable<T>
export function take<T>(n: number, observable: Observable<T>): Observable<T> {
  return makeObservable(observable, new Take(observable.src, n, isProperty(observable)))
}

class Take<T> extends Operator<T, T> implements Invokeable<undefined> {
  constructor(source: Source<T>, private n: number, private readonly isProp: boolean) {
    super(source)
  }

  public subscribe(subscriber: Subscriber<T>, order: number): Subscription {
    if (this.n === 0) {
      this.init(subscriber, order, NOOP_SUBSCRIPTION)
      return this
    } else {
      return super.subscribe(subscriber, order)
    }
  }

  public activate(): void {
    if (this.n === 0) {
      if (this.isProp) {
        this.invoke()
      } else {
        scheduleActivationTask(invoke(this))
      }
    } else {
      super.activate()
    }
  }

  // called if someone trying to activate EventStream/Property that has already
  // taken N events
  public invoke(): void {
    this.active && sendRootEnd(this.sink)
  }

  public next(tx: Transaction, val: T): void {
    const n = --this.n
    this.sink.next(tx, val)
    n === 0 && this.sink.end(tx)
  }
}
