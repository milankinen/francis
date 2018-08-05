import { Source } from "../_core"
import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { constantly, curry2, isFunction } from "../_util"
import { Observable } from "../Observable"
import { Identity } from "./_base"

export type EndProjection<T> = T | (() => T)

export interface MapEndOp {
  <T>(f: EndProjection<T>, observable: Observable<T>): Observable<T>
  <T>(f: EndProjection<T>): (observable: Observable<T>) => Observable<T>
}

export const mapEnd: MapEndOp = curry2(_mapEnd)

function _mapEnd<T>(f: EndProjection<T>, observable: Observable<T>): Observable<T> {
  const projection = isFunction(f) ? (f as () => T) : constantly((f as any) as T)
  return makeObservable(observable, new MapEnd(observable.src, projection))
}

class MapEnd<T> extends Identity<T> {
  constructor(source: Source<T>, private f: () => T) {
    super(source)
  }

  public end(tx: Transaction): void {
    const { f } = this
    this.sink.next(tx, f())
    this.sink.end(tx)
  }
}
