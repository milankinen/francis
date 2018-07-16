import { EventStream, EventStreamDispatcher, isEventStream } from "./EventStream"
import { Observable } from "./Observable"
import { Operator } from "./operators/_base"
import { isProperty, Property, PropertyDispatcher } from "./Property"

export function makeObservable<T>(parent: Observable<any>, op: Operator<any, T>): Observable<T> {
  return isProperty(parent) ? makeProperty(op) : makeEventStream(op)
}

export function makeEventStream<T>(op: Operator<any, T>): EventStream<T> {
  return new EventStream(new EventStreamDispatcher(op))
}

export function makeProperty<T>(op: Operator<any, T>): Property<T> {
  return new Property(new PropertyDispatcher(op))
}

export function isObservable<T>(x: any): x is Observable<T> {
  return isEventStream(x) || isProperty(x)
}
