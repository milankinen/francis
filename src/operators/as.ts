import { checkEventStream, checkProperty } from "../_check"
import { EventStream } from "../EventStream"
import { Observable } from "../Observable"
import { Property } from "../Property"

export function asEventStream<T>(observable: Observable<T>): EventStream<T> {
  checkEventStream(observable)
  return observable as EventStream<T>
}

export function asProperty<T>(observable: Observable<T>): Property<T> {
  checkProperty(observable)
  return observable as Property<T>
}
