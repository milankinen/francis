import { checkFunction } from "../_check"
import { AnyEvent, AsyncCallback, AsyncNodeCallback } from "../_interfaces"
import * as Event from "../Event"
import { EventStream } from "../EventStream"
import { fromBinder } from "./fromBinder"

export function fromCallback<ValueType>(f: AsyncCallback<ValueType>): EventStream<ValueType> {
  checkFunction(f)
  return fromBinder<ValueType>(sink => {
    const callback = (result: ValueType | AnyEvent<ValueType>) => {
      sink([result, new Event.End()])
    }
    f(callback)
  })
}

export function fromNodeCallback<ValueType>(
  f: AsyncNodeCallback<ValueType>,
): EventStream<ValueType> {
  checkFunction(f)
  return fromBinder<ValueType>(sink => {
    const callback = (error: Error | null, result?: ValueType | AnyEvent<ValueType>) => {
      sink([error !== null ? new Event.Error(error) : (result as any), new Event.End()])
    }
    f(callback)
  })
}
