import { isFunction } from "util"
import { Source } from "../_core"
import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { constantly } from "../_util"
import { EventStream } from "../EventStream"
import { Observable } from "../Observable"
import { Property } from "../Property"
import { Identity } from "./_base"

export type EndProjection<T> = T | (() => T)

export function mapEnd<T>(f: EndProjection<T>, observable: EventStream<T>): EventStream<T>
export function mapEnd<T>(f: EndProjection<T>, observable: Property<T>): Property<T>
export function mapEnd<T>(f: EndProjection<T>, observable: Observable<T>): Observable<T>
export function mapEnd<T>(f: EndProjection<T>, observable: Observable<T>): Observable<T> {
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
