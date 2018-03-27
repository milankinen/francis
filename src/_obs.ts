import { EventStream } from "./EventStream"
import { Observable } from "./Observable"
import { Operator } from "./operators/_base"
import { Property } from "./Property"

export function makeObservable<T>(op: Operator<any, T>): Observable<T> {
  return op.sync ? new Property(op) : new EventStream(op)
}
