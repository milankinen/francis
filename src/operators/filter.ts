import { Source } from "../_core"
import { Predicate } from "../_interfaces"
import { Transaction } from "../_tx"
import { EventStream } from "../EventStream"
import { Observable } from "../Observable"
import { derive, Property } from "../Property"
import { Operator } from "./_base"

export function filter<T>(predicate: Predicate<T>, stream: EventStream<T>): EventStream<T>
export function filter<T>(predicate: Predicate<T>, property: Property<T>): Property<T>
export function filter<T>(predicate: Predicate<T>, observable: Observable<T>): Observable<T> {
  return _filter(predicate, observable)
}

export function _filter<T>(predicate: Predicate<T>, observable: Observable<T>): Observable<T> {
  return derive(observable, new Filter(observable.op, predicate))
}

class Filter<T> extends Operator<T, T> {
  constructor(source: Source<T>, private p: Predicate<T>) {
    super(source)
  }

  public event(tx: Transaction, val: T): void {
    const predicate = this.p
    // tslint:disable-next-line:no-unused-expression
    predicate(val) && this.next.event(tx, val)
  }

  public initial(tx: Transaction, val: T): void {
    const predicate = this.p
    // tslint:disable-next-line:no-unused-expression
    predicate(val) ? this.next.initial(tx, val) : this.next.noinitial(tx)
  }
}
