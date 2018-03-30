import { __DEVBUILD__, assert } from "../_assert"
import { Subscribe } from "../_interfaces"
import { makeEventStream } from "../_obs"
import { isFunction } from "../_util"
import { EventStream } from "../EventStream"
import { identity } from "../operators/_base"
import { FromBinder } from "./_binder"

export function fromBinder<T>(subscribe: Subscribe<T>): EventStream<T> {
  if (__DEVBUILD__) {
    assert(isFunction(subscribe), "Subscribe must be a function")
  }
  return makeEventStream(identity(new FromBinder(subscribe)))
}
