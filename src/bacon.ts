import { Dispose, Handler, Predicate, Projection } from "./_interfaces"
import { toFunction } from "./_interrop"
import { EventStream } from "./EventStream"
import { Observable } from "./Observable"
import * as Filter from "./operators/filter"
import * as First from "./operators/first"
import * as FlatMap from "./operators/flatMap"
import * as Log from "./operators/log"
import * as Map from "./operators/map"
import * as Sample from "./operators/sample"
import * as Subscribe from "./operators/subscribe"
import * as Take from "./operators/take"
import * as ToProperty from "./operators/toProperty"
import { isProperty, Property } from "./Property"

declare module "./Observable" {
  interface Observable<A> {
    subscribe(handler: Handler<A>): Dispose
    log(label?: string): Dispose
    map<B>(project: Projection<A, B>): Observable<B>
    filter(predicate: Predicate<A>): Observable<A>
    take(n: number): Observable<A>
    first(): Observable<A>
    flatMapLatest<B>(project: Projection<A, Observable<B>>): Observable<B>
  }
}

declare module "./EventStream" {
  interface EventStream<A> {
    map<B>(project: Projection<A, B>, ...args: any[]): EventStream<B>
    filter(predicate: Predicate<A>): EventStream<A>
    take(n: number): EventStream<A>
    first(): EventStream<A>
    flatMapLatest<B>(project: Projection<A, Observable<B>>): EventStream<B>
    toProperty(initialValue: A): Property<A>
  }
}

declare module "./Property" {
  interface Property<A> {
    map<B>(project: Projection<A, B>, ...args: any[]): Property<B>
    filter(predicate: Predicate<A>): Property<A>
    take(n: number): Property<A>
    first(): Property<A>
    flatMapLatest<B>(project: Projection<A, Observable<B>>): Property<B>
    sampleBy<B>(sampler: EventStream<B>): EventStream<A>
    sampleBy<B, C>(sampler: EventStream<B>, f: SampleFn<A, B, C>): EventStream<C>
    sampleBy<B>(sampler: Property<B>): Property<A>
    sampleBy<B, C>(sampler: Property<B>, f: SampleFn<A, B, C>): Property<C>
  }
}

export type SampleFn<V, S, R> = (value: V, sample: S) => R

// Observable operators (common for both EventStream and Property)

Observable.prototype.subscribe = function<A>(handler: Handler<A>): Dispose {
  return Subscribe.subscribe(handler, this)
}

Observable.prototype.log = function(label?: string): Dispose {
  return Log.log(label, this)
}

Observable.prototype.map = function<A, B>(
  project: Projection<A, B>,
  // tslint:disable-next-line:trailing-comma
  ...args: any[]
): Observable<B> {
  if (isProperty(project as any)) {
    return Sample._sampleByF(this, (v: any, _: any) => v, project as any)
  } else {
    return Map._map(toFunction(project, args), this)
  }
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

Observable.prototype.flatMapLatest = function<A, B>(
  project: Projection<A, Observable<B>>,
): Observable<B> {
  return FlatMap._flatMapLatest(project, this)
}

// EventStream specific operators

EventStream.prototype.toProperty = function<A>(initialValue: A): Property<A> {
  return ToProperty.toProperty(initialValue, this)
}

// Property specific operators

Property.prototype.sampleBy = function<A, B, C>(
  sampler: Observable<B>,
  f?: SampleFn<A, B, C>,
): any {
  const fn = f === undefined ? (v: A, s: B) => v as any : f
  return Sample._sampleByF(sampler, fn, this)
}

// factory functions

export { once } from "./sources/once"
export { constant } from "./sources/constant"
export { fromArray } from "./sources/fromArray"
export { sequentially } from "./sources/sequentially"
export { fromPoll } from "./sources/fromPoll"
export { combineAsArray } from "./operators/combine"

// classes and interfaces

export * from "./_interfaces"
export { Initial, Next, Error, End } from "./Event"
export { Observable } from "./Observable"
export { EventStream } from "./EventStream"
export { Property } from "./Property"
