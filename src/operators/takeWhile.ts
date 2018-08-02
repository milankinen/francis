import { EndStateAware, Source } from "../_core"
import { Predicate } from "../_interfaces"
import { makeStatefulObservable } from "../_obs"
import { Transaction } from "../_tx"
import { EventStream } from "../EventStream"
import { Observable } from "../Observable"
import { isProperty, Property } from "../Property"
import { Operator } from "./_base"
import { filter } from "./filter"
import { startWith } from "./startWith"
import { takeUntil } from "./takeUntil"

export function takeWhile<T>(
  f: Predicate<T> | Property<boolean>,
  property: Property<T>,
): Property<T>
export function takeWhile<T>(
  f: Predicate<T> | Property<boolean>,
  stream: EventStream<T>,
): EventStream<T>
export function takeWhile<T>(
  f: Predicate<T> | Property<boolean>,
  observable: Observable<T>,
): Observable<T>
export function takeWhile<T>(
  f: Predicate<T> | Property<boolean>,
  observable: Observable<T>,
): Observable<T> {
  return isProperty(f)
    ? takeUntil(filter(x => !x, startWith(true, f)), observable)
    : makeStatefulObservable(observable, new TakeWhile(observable.src, f))
}

class TakeWhile<T> extends Operator<T, T> implements EndStateAware {
  private ended: boolean = false

  constructor(src: Source<T>, private f: Predicate<T>) {
    super(src)
  }

  public isEnded(): boolean {
    return this.ended
  }

  public next(tx: Transaction, val: T): void {
    const { f } = this
    if (!f(val)) {
      this.ended = true
      this.sink.end(tx)
    } else {
      this.sink.next(tx, val)
    }
  }
}
