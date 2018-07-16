import { invoke, Invokeable, sendRootNext, Source, Subscriber, Subscription } from "../_core"
import { makeProperty } from "../_obs"
import { Transaction } from "../_tx"
import { EventStream } from "../EventStream"
import { Observable } from "../Observable"
import { isProperty, Property } from "../Property"
import { schedulePropertyActivation, Scheduler } from "../scheduler/index"
import { Operator } from "./_base"

export function startWith<T>(value: T, stream: EventStream<T>): EventStream<T>
export function startWith<T>(value: T, property: Property<T>): Property<T>
export function startWith<T>(value: T, observable: Observable<T>): Observable<T>
export function startWith<T>(value: T, observable: Observable<T>): Observable<T> {
  if (isProperty<T>(observable)) {
    return _startWithP(value, observable)
  } else {
    throw new Error("Not supported yet")
  }
}

export function _startWithP<T>(value: T, property: Property<T>): Property<T> {
  return makeProperty(new StartWithP(property.src, value))
}

class StartWithP<T> extends Operator<T, T> implements Invokeable<undefined> {
  // flag indicating whether we have an existing initial value for property or not
  // if this flag is set to true, there is no point running this operator anymore
  private has: boolean = false

  constructor(source: Source<T>, private value: T) {
    super(source)
  }

  public subscribe(scheduler: Scheduler, subscriber: Subscriber<T>, order: number): Subscription {
    // schedule any "inner" property activations first so that we can receive any
    // initial values before we send the startWith value
    const subs = super.subscribe(scheduler, subscriber, order)
    // we know that this opetator results in property so if we have received a value
    // at any point before we know that the PropertyDispatcher is going to replay it
    // so in that case we don't need to ensure initial value anymore
    if (!this.has) {
      schedulePropertyActivation(scheduler, invoke(this))
    }
    return subs
  }

  public invoke(): void {
    if (!this.has && this.sink.begin()) {
      this.has = true
      sendRootNext(this.sink, this.value)
    }
  }

  public next(tx: Transaction, val: T): void {
    this.has = true
    this.sink.next(tx, val)
  }
}
