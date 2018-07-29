import { invoke, Invokeable, sendNextInTx, Source } from "../_core"
import { makeEventStream, makeProperty } from "../_obs"
import { Transaction } from "../_tx"
import { EventStream } from "../EventStream"
import { Observable } from "../Observable"
import { isProperty, Property } from "../Property"
import { scheduleActivationTask } from "../scheduler/index"
import { Identity, Operator } from "./_base"

export function startWith<T>(value: T, stream: EventStream<T>): EventStream<T>
export function startWith<T>(value: T, property: Property<T>): Property<T>
export function startWith<T>(value: T, observable: Observable<T>): Observable<T>
export function startWith<T>(value: T, observable: Observable<T>): Observable<T> {
  return isProperty<T>(observable)
    ? _startWithP(value, observable)
    : _startWithE(value, observable as EventStream<T>)
}

export function _startWithE<T>(value: T, stream: EventStream<T>): EventStream<T> {
  return makeEventStream(new StartWithE(stream.src, value))
}

export function _startWithP<T>(value: T, property: Property<T>): Property<T> {
  return makeProperty(new StartWithP(property.src, value))
}

class StartWithP<T> extends Operator<T, T> {
  // flag indicating whether we have an existing initial value for property or not
  // if this flag is set to true, there is no point running this operator anymore
  private has: boolean = false
  constructor(source: Source<T>, private readonly value: T) {
    super(source)
  }

  public activate(initialNeeded: boolean): void {
    super.activate(initialNeeded)
    this.sendInitial()
  }

  public next(tx: Transaction, val: T): void {
    this.has = true
    this.sink.next(tx, val)
  }

  private sendInitial(): void {
    if (this.active && !this.has) {
      this.has = true
      sendNextInTx(this.sink, this.value)
    }
  }
}

class StartWithE<T> extends Identity<T> implements Invokeable<undefined> {
  constructor(source: Source<T>, private readonly value: T) {
    super(source)
  }

  public activate(initialNeeded: boolean): void {
    scheduleActivationTask(invoke(this))
    super.activate(initialNeeded)
  }

  public invoke(): void {
    this.active && sendNextInTx(this.sink, this.value)
  }
}
