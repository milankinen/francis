import { Dispose, Handler } from "./_interfaces"
import { Observable } from "./Observable"
import * as Subscribe from "./operators/subscribe"

declare module "./Observable" {
  interface Observable<A> {
    subscribe(handler: Handler<A>): Dispose
  }
}

declare module "./EventStream" {
  interface EventStream<A> {}
}

declare module "./Property" {
  interface Property<A> {}
}

// Observable operators (common for both EventStream and Property)

Observable.prototype.subscribe = function<A>(handler: Handler<A>): Dispose {
  return Subscribe.subscribe(handler, this)
}

// factory functions

export { once } from "./sources/once"
export { constant } from "./sources/constant"

// classes and interfaces

export * from "./Event"
export * from "./_interfaces"
export { Observable } from "./Observable"
export { EventStream } from "./EventStream"
export { AnyObs, Property } from "./Property"
