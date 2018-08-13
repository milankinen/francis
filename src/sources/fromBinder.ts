import { checkFunction } from "../_check"
import { Subscribe } from "../_interfaces"
import { makeEventStream } from "../_obs"
import { EventStream } from "../EventStream"
import { FromBinder } from "./_binder"

export function fromBinder<T>(subscribe: Subscribe<T>): EventStream<T> {
  checkFunction(subscribe)
  return makeEventStream(new FromBinder(subscribe))
}
