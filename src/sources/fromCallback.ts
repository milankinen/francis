import { checkFunction } from "../_check"
import { AnyEvent, AsyncCallback, AsyncNodeCallback } from "../_interfaces"
import * as Event from "../Event"
import { EventStream } from "../EventStream"
import { fromBinder } from "./fromBinder"

export function fromCallback<T>(f: AsyncCallback<T>, ...args: any[]): EventStream<T> {
  checkFunction(f)
  f = bind(f, args)
  return fromBinder<T>(sink => {
    const callback = (result: T | AnyEvent<T>) => {
      sink([result, new Event.End()])
    }
    f(callback)
  })
}

export function fromNodeCallback<T>(f: AsyncNodeCallback<T>, ...args: any[]): EventStream<T> {
  checkFunction(f)
  f = bind(f, args)
  return fromBinder<T>(sink => {
    const callback = (error: Error | null, result?: T | AnyEvent<T>) => {
      sink([error !== null ? new Event.Error(error) : (result as any), new Event.End()])
    }
    f(callback)
  })
}

function bind<T, F extends AsyncCallback<T> | AsyncNodeCallback<T>>(f: F, args: any[]): F {
  return args.length > 0 ? f.bind(null, ...args) : f
}
