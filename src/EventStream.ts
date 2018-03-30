import { __DEVBUILD__, assert } from "./_assert"
import { Observable } from "./Observable"
import { Operator } from "./operators/_base"

export class EventStream<A> extends Observable<A> {
  constructor(op: Operator<any, A>) {
    super(op)
    if (__DEVBUILD__) {
      assert(!op.sync, "Trying to create EventStream from synchronous source")
    }
  }
}

export function isEventStream<T>(x: any): x is EventStream<T> {
  return x && x instanceof EventStream
}
