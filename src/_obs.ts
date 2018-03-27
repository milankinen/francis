import { EventStream, isEventStream } from "./EventStream"
import { Observable } from "./Observable"
import { Operator } from "./operators/_base"
import { isProperty, Property } from "./Property"

export function makeObservable<T>(op: Operator<any, T>): Observable<T> {
  return op.sync ? new Property(op) : new EventStream(op)
}

export function isObservable<T>(x: any): x is Observable<T> {
  return isEventStream(x) || isProperty(x)
}
