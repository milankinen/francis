import { assert } from "../_assert"
import { EventStream, isEventStream } from "../EventStream"
import { Observable } from "../Observable"
import { isProperty, Property } from "../Property"

export function asEventStream<T>(observable: Observable<T>): EventStream<T> {
  assert(isEventStream(observable), `Can't typecast observable to EventStream: ${observable}`)
  return observable as EventStream<T>
}

export function asProperty<T>(observable: Observable<T>): Property<T> {
  assert(isProperty(observable), `Can't typecast observable to EventStream: ${observable}`)
  return observable as Property<T>
}
