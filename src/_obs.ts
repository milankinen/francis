import { checkObservable } from "./_check"
import { EndStateAware } from "./_core"
import {
  EventStream,
  EventStreamDispatcher,
  isEventStream,
  StatfulEventStreamDispatcher,
} from "./EventStream"
import { Observable } from "./Observable"
import { Operator } from "./operators/_base"
import { isProperty, Property, PropertyDispatcher } from "./Property"

export function makeObservable<T>(parent: Observable<any>, op: Operator<any, T>): Observable<T> {
  checkObservable(parent)
  return isProperty(parent) ? makeProperty(op) : makeEventStream(op)
}

export function makeStatefulObservable<T>(
  parent: Observable<any>,
  op: Operator<any, T> & EndStateAware,
): Observable<T> {
  checkObservable(parent)
  return isProperty(parent) ? makeProperty(op) : makeStatefulEventStream(op)
}

export function makeEventStream<T>(op: Operator<any, T>): EventStream<T> {
  return new EventStream(new EventStreamDispatcher(op))
}

export function makeStatefulEventStream<T>(op: Operator<any, T> & EndStateAware): EventStream<T> {
  return new EventStream(new StatfulEventStreamDispatcher(op))
}

export function makeProperty<T>(op: Operator<any, T>): Property<T> {
  return new Property(new PropertyDispatcher(op))
}

export function isObservable<T>(x: any): x is Observable<T> {
  return isEventStream(x) || isProperty(x)
}
