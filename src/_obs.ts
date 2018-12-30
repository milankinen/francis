import { checkObservable } from "./_check"
import { Source } from "./_core"
import { EventStream, EventStreamDispatcher, isEventStream } from "./EventStream"
import { Observable } from "./Observable"
import { isProperty, Property, PropertyDispatcher } from "./Property"

export function makeObservable<T>(parent: Observable<any>, source: Source<T>): Observable<T> {
  checkObservable(parent)
  return isProperty(parent) ? makeProperty(source) : makeEventStream(source)
}

export function makeEventStream<T>(source: Source<T>): EventStream<T> {
  return new EventStream(new EventStreamDispatcher(source))
}

export function makeProperty<T>(source: Source<T>): Property<T> {
  return new Property(new PropertyDispatcher(source))
}

/**
 * Test whether the given value is Francis observable or not
 * @param x - Value to be tested
 * @returns `true` if value extends observable, otherwise `false`
 * @public
 */
export function isObservable<T>(x: any): x is Observable<T> {
  return isEventStream(x) || isProperty(x)
}
