import { __DEVBUILD__, assert } from "./_assert"
import { Observable } from "./Observable"
import { Operator } from "./operators/_base"

export class Property<A> extends Observable<A> {
  constructor(op: Operator<any, A>) {
    super(op)
    if (__DEVBUILD__) {
      assert(op.sync, "Trying to create Property from non-synchronous source")
    }
  }
}

export function isProperty<T>(x: any): x is Property<T> {
  return x && x instanceof Property
}
