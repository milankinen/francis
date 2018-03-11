import { Dispose, Handler, Predicate, Projection } from "./_interfaces"
import { Observable } from "./Observable"
import * as Filter from "./operators/filter"
import * as First from "./operators/first"
import * as Map from "./operators/map"
import * as Subscribe from "./operators/subscribe"
import * as Take from "./operators/take"

declare module "./Observable" {
  interface Observable<A> {
    subscribe(handler: Handler<A>): Dispose
    map<B>(project: Projection<A, B>): Observable<B>
    filter(predicate: Predicate<A>): Observable<A>
    take(n: number): Observable<A>
    first(): Observable<A>
  }
}

declare module "./EventStream" {
  interface EventStream<A> {
    map<B>(project: Projection<A, B>): EventStream<B>
    filter(predicate: Predicate<A>): EventStream<A>
    take(n: number): EventStream<A>
    first(): EventStream<A>
  }
}

declare module "./Property" {
  interface Property<A> {
    map<B>(project: Projection<A, B>): Property<B>
    filter(predicate: Predicate<A>): Property<A>
    take(n: number): Property<A>
    first(): Property<A>
  }
}

export type SampleFn<V, S, R> = (value: V, sample: S) => R

// Observable operators (common for both EventStream and Property)

Observable.prototype.subscribe = function<A>(handler: Handler<A>): Dispose {
  return Subscribe.subscribe(handler, this)
}

Observable.prototype.map = function<A, B>(project: Projection<A, B>): Observable<B> {
  return Map._map(project, this)
}

Observable.prototype.filter = function<A>(predicate: Predicate<A>): Observable<A> {
  return Filter._filter(predicate, this)
}

Observable.prototype.take = function<A>(n: number): Observable<A> {
  return Take._take(n, this)
}

Observable.prototype.first = function<A>(): Observable<A> {
  return First._first(this)
}

// factory functions

export { once } from "./sources/once"
export { constant } from "./sources/constant"
export { fromArray } from "./sources/fromArray"

// classes and interfaces

export * from "./Event"
export * from "./_interfaces"
export { Observable } from "./Observable"
export { EventStream } from "./EventStream"
export { AnyObs, Property } from "./Property"
