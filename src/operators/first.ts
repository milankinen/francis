import { EventStream } from "../EventStream"
import { Observable } from "../Observable"
import { Property } from "../Property"
import { take } from "./take"

export function first<T>(stream: EventStream<T>): EventStream<T>
export function first<T>(property: Property<T>): Property<T>
export function first<T>(observable: Observable<T>): Observable<T>
export function first<T>(observable: Observable<T>): Observable<T> {
  return take(1, observable)
}
