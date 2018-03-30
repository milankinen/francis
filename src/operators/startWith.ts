import { Source } from "../_core"
import { makeProperty } from "../_obs"
import { Transaction } from "../_tx"
import { EventStream } from "../EventStream"
import { Observable } from "../Observable"
import { isProperty, Property } from "../Property"
import { Operator } from "./_base"

export function startWith<T>(value: T, stream: EventStream<T>): EventStream<T>
export function startWith<T>(value: T, property: Property<T>): Property<T>
export function startWith<T>(value: T, observable: Observable<T>): Observable<T> {
  return _startWith(value, observable)
}

export function _startWith<T>(value: T, observable: Observable<T>): Observable<T> {
  if (isProperty<T>(observable)) {
    return _startWithP(value, observable)
  } else {
    throw new Error("Not supported yet")
  }
}

export function _startWithP<T>(value: T, property: Property<T>): Property<T> {
  return makeProperty(new StartWithP(property.op, value))
}

class StartWithP<T> extends Operator<T, T> {
  constructor(source: Source<T>, private value: T) {
    super(source, true)
  }

  public event(tx: Transaction, val: T): void {
    this.dispatcher.event(tx, val)
  }

  public initial(tx: Transaction, val: T): void {
    this.dispatcher.initial(tx, val)
  }

  public noinitial(tx: Transaction): void {
    this.dispatcher.initial(tx, this.value)
  }
}
