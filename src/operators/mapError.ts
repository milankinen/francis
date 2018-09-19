import { checkFunction } from "../_check"
import { Source } from "../_core"
import { Projection } from "../_interfaces"
import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { curry2 } from "../_util"
import { dispatcherOf, Observable } from "../Observable"
import { Identity } from "./_base"

export interface MapErrorOp {
  <T>(project: Projection<Error, T>, observable: Observable<T>): Observable<T>
  <T>(project: Projection<Error, T>): (observable: Observable<T>) => Observable<T>
}

export const mapError: MapErrorOp = curry2(_mapError)

function _mapError<T>(project: Projection<Error, T>, observable: Observable<T>): Observable<T> {
  checkFunction(project)
  return makeObservable(observable, new MapError(dispatcherOf(observable), project))
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
