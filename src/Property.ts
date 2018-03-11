import { EventStream } from "./EventStream"
import { Observable } from "./Observable"
import { Operator } from "./operators/_base"
import { PropertyMulticast } from "./operators/_property"

export class Property<A> extends Observable<A> {
  constructor(op: Operator<any, A>) {
    super(op)
    op.setMulticastImplementation(new PropertyMulticast())
  }
}

export type AnyObs<A> = Property<A> | EventStream<A>

export function isProperty<T>(x: any): x is Property<T> {
  return x && x instanceof Property
}

export function derive<A, B>(observable: Observable<A>, op: Operator<A, B>): Observable<B> {
  return isProperty(observable) ? new Property(op) : new EventStream(op)
}
