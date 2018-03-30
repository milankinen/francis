import { EventStreamDispatcher, PropertyDispatcher } from "./_dispatcher"
import { EventStream, isEventStream } from "./EventStream"
import { Observable } from "./Observable"
import { Operator } from "./operators/_base"
import { isProperty, Property } from "./Property"

export function makeObservable<T>(op: Operator<any, T>): Observable<T> {
  return op.sync ? makeProperty(op) : makeEventStream(op)
}

export function makeEventStream<T>(op: Operator<any, T>): EventStream<T> {
  op.setDispatcher(new EventStreamDispatcher())
  return new EventStream(op)
}

export function makeProperty<T>(op: Operator<any, T>): Property<T> {
  op.setDispatcher(new PropertyDispatcher())
  return new Property(op)
}

export function isObservable<T>(x: any): x is Observable<T> {
  return isEventStream(x) || isProperty(x)
}
