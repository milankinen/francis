import { sendNextInTx, Source } from "../_core"
import { makeProperty } from "../_obs"
import { Transaction } from "../_tx"
import { EventStream } from "../EventStream"
import { Observable } from "../Observable"
import { isProperty, Property } from "../Property"
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

class StartWithP<T> extends Operator<T, T> {
  // flag indicating whether we have an existing initial value for property or not
  // if this flag is set to true, there is no point running this operator anymore
  private has: boolean = false

  constructor(source: Source<T>, private readonly value: T) {
    super(source)
  }

  public activate(): void {
    super.activate()
    this.sendInitial()
  }

  public dispose(): void {
    this.has = false
    super.dispose()
  }

  public sendInitial(): void {
    if (this.active && !this.has) {
      this.has = true
      sendNextInTx(this.sink, this.value)
    }
  }

  public next(tx: Transaction, val: T): void {
    this.has = true
    this.sink.next(tx, val)
  }
}
