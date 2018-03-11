import { Observable } from "./Observable"
import { Operator } from "./operators/_base"
import { StreamMulticast } from "./operators/_stream"

export class EventStream<A> extends Observable<A> {
  constructor(op: Operator<any, A>) {
    super(op)
    op.setMulticastImplementation(new StreamMulticast())
  }
}

export function isEventStream<T>(x: any): x is EventStream<T> {
  return x && x instanceof EventStream
}
