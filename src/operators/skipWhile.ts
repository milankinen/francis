import { Source } from "../_core"
import { Predicate } from "../_interfaces"
import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { EventStream } from "../EventStream"
import { Observable } from "../Observable"
import { isProperty, Property } from "../Property"
import { Operator } from "./_base"
import { filter } from "./filter"
import { skipUntil } from "./skipUntil"
import { startWith } from "./startWith"

export function skipWhile<T>(
  f: Predicate<T> | Property<boolean>,
  property: Property<T>,
): Property<T>
export function skipWhile<T>(
  f: Predicate<T> | Property<boolean>,
  stream: EventStream<T>,
): EventStream<T>
export function skipWhile<T>(
  f: Predicate<T> | Property<boolean>,
  observable: Observable<T>,
): Observable<T>
export function skipWhile<T>(
  f: Predicate<T> | Property<boolean>,
  observable: Observable<T>,
): Observable<T> {
  return isProperty(f)
    ? skipUntil(filter(x => !x, startWith(true, f)), observable)
    : makeObservable(observable, new SkipWhile(observable.src, f))
}

class SkipWhile<T> extends Operator<T, T> {
  private pass: boolean = false

  constructor(src: Source<T>, private f: Predicate<T>) {
    super(src)
  }

  public next(tx: Transaction, val: T): void {
    const { f } = this
    if (this.pass || (this.pass = !f(val))) {
      this.sink.next(tx, val)
    }
  }
}
