import { Source } from "../_core"
import { Projection } from "../_interfaces"
import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { EventStream } from "../EventStream"
import { Observable } from "../Observable"
import { Property } from "../Property"
import { Identity } from "./_base"

export function mapError<T>(
  project: Projection<Error, T>,
  observable: EventStream<T>,
): EventStream<T>
export function mapError<T>(project: Projection<Error, T>, observable: Property<T>): Property<T>
export function mapError<T>(project: Projection<Error, T>, observable: Observable<T>): Observable<T>
export function mapError<T>(
  project: Projection<Error, T>,
  observable: Observable<T>,
): Observable<T> {
  return makeObservable(observable, new MapError(observable.src, project))
}

class MapError<T> extends Identity<T> {
  constructor(source: Source<T>, private p: Projection<Error, T>) {
    super(source)
  }

  public error(tx: Transaction, err: Error): void {
    const { p } = this
    this.sink.next(tx, p(err))
  }
}
