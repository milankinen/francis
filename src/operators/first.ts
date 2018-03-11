import { EventStream } from "../EventStream"
import { Observable } from "../Observable"
import { Property } from "../Property"
import { _take } from "./take"

export function first<T>(stream: EventStream<T>): EventStream<T>
export function first<T>(property: Property<T>): Property<T>
export function first<T>(observable: Observable<T>): Observable<T> {
  return _first(observable)
}

export function _first<T>(observable: Observable<T>): Observable<T> {
  return _take(1, observable)
}
