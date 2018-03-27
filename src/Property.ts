import { __DEVBUILD__, assert } from "./_assert"
import { Observable } from "./Observable"
import { Operator } from "./operators/_base"
import { PropertyMulticast } from "./operators/_property"

export class Property<A> extends Observable<A> {
  constructor(op: Operator<any, A>) {
    super(op)
    if (__DEVBUILD__) {
      assert(() => op.sync, "Trying to create Property from non-synchronous source")
    }
    op.setMulticastImplementation(new PropertyMulticast())
  }
}

export function isProperty<T>(x: any): x is Property<T> {
  return x && x instanceof Property
}
