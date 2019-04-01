import { Source } from "../_core"
import { In, Out } from "../_interfaces"
import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { constantly, curry2, isFunction } from "../_util"
import { dispatcherOf, Observable } from "../Observable"
import { Identity } from "./_base"

export type EndProjection<T> = T | (() => T)

export const mapEnd: CurriedMapEnd = curry2(_mapEnd)
export interface CurriedMapEnd {
  <ObsType, ValueType>(f: EndProjection<ValueType>, observable: In<ObsType, ValueType>): Out<
    ObsType,
    ValueType
  >
  <ValueType>(f: EndProjection<ValueType>): <ObsType>(
    observable: In<ObsType, ValueType>,
  ) => Out<ObsType, ValueType>
}

function _mapEnd<T>(f: EndProjection<T>, observable: Observable<T>): Observable<T> {
  const projection = isFunction(f) ? (f as () => T) : constantly((f as any) as T)
  return makeObservable(observable, new MapEnd(dispatcherOf(observable), projection))
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
