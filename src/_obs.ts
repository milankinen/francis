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

export function isObservable<T>(x: any): x is Observable<T> {
  return isEventStream(x) || isProperty(x)
}
