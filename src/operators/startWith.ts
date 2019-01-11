import { checkObservable } from "../_check"
import { invoke, Invokeable, sendNextInTx, Source, Subscriber, Subscription } from "../_core"
import { makeEventStream } from "../_obs"
import { curry2 } from "../_util"
import { EventStream } from "../EventStream"
import { dispatcherOf, Observable } from "../Observable"
import { isProperty, Property, PropertyDispatcher } from "../Property"
import { scheduleActivationTask } from "../scheduler/index"
import { Identity } from "./_base"

export interface StartWithOp {
  <T>(value: T, observable: Observable<T>): Observable<T>
  <T>(value: T): (observable: Observable<T>) => Observable<T>
}

export const startWith: StartWithOp = curry2(_startWith)

function _startWith<T>(value: T, observable: Observable<T>): Observable<T> {
  checkObservable(observable)
  return isProperty<T>(observable)
    ? _startWithP(value, observable)
    : _startWithE(value, observable as EventStream<T>)
}

export function _startWithE<T>(value: T, stream: EventStream<T>): EventStream<T> {
  return makeEventStream(new StartWithE(dispatcherOf(stream), value))
}

export function _startWithP<T>(value: T, property: Property<T>): Property<T> {
  return new Property(new StartWithDispatcher(dispatcherOf(property), value))
}

class StartWithDispatcher<T> extends PropertyDispatcher<T> {
  constructor(source: Source<T>, value: T) {
    super(source)
    this.val = value
  }
}

class StartWithE<T> extends Identity<T> {
  constructor(source: Source<T>, private readonly value: T) {
    super(source)
  }

  public subscribe(subscriber: Subscriber<T>, order: number): Subscription {
    return new StartWithESubscription(this, super.subscribe(subscriber, order))
  }

  public start(): void {
    this.active && sendNextInTx(this.sink, this.value)
  }
}

class StartWithESubscription<T> implements Subscription, Invokeable<undefined> {
  private d: boolean = false
  constructor(private swe: StartWithE<T>, private s: Subscription) {}

  public activate(initialNeeded: boolean): void {
    scheduleActivationTask(invoke(this))
    this.swe.activate(initialNeeded)
  }

  public invoke(): void {
    !this.d && this.swe.start()
  }

  public dispose(): void {
    this.d = true
    this.s.dispose()
  }

  public reorder(order: number): void {
    this.s.reorder(order)
  }
}
