import { checkEventStream, checkProperty } from "../_check"
import { EventStream } from "../EventStream"
import { Observable } from "../Observable"
import { Property } from "../Property"

/**
 * Restores the given observables type information. Fails if the
 * observable's runtime type is not EventSTream.
 *
 * @param observable - Observable whose type information will be restored
 * @public
 */
export function asEventStream<T>(observable: Observable<T>): EventStream<T> {
  checkEventStream(observable)
  return observable as EventStream<T>
}

/**
 * Restores the given observables type information. Fails if the
 * observable's runtime type is not Property.
 *
 * @param observable - Observable whose type information will be restored
 * @public
 */
export function asProperty<T>(observable: Observable<T>): Property<T> {
  checkProperty(observable)
  return observable as Property<T>
}
