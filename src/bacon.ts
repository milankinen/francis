import { Dispose, Handler, Predicate, Projection } from "./_interfaces"
import { toFunction, toFunctionsPropAsIs } from "./_interrop"
import { EventStream } from "./EventStream"
import { Observable } from "./Observable"
import * as Filter from "./operators/filter"
import * as First from "./operators/first"
import * as FlatMap from "./operators/flatMap"
import * as Log from "./operators/log"
import * as Map from "./operators/map"
import * as Sample from "./operators/sample"
import * as StartWith from "./operators/startWith"
import * as Subscribe from "./operators/subscribe"
import * as Take from "./operators/take"
import * as ToProperty from "./operators/toProperty"
import { Property } from "./Property"

declare module "./Observable" {
  interface Observable<A> {
    subscribe(handler: Handler<A>): Dispose
    log(label?: string): Dispose
    map<B>(project: Projection<A, B>): Observable<B>
    filter(predicate: Predicate<A> | Property<any>): Observable<A>
    take(n: number): Observable<A>
    first(): Observable<A>
    flatMapLatest<B>(project: Projection<A, B | Observable<B>>): Observable<B>
    flatMapFirst<B>(project: Projection<A, B | Observable<B>>): Observable<B>
    flatMap<B>(project: Projection<A, B | Observable<B>>): Observable<B>
    flatMapConcat<B>(project: Projection<A, B | Observable<B>>): Observable<B>
    flatMapWithConcurrencyLimit<B>(
      limit: number,
      project: Projection<A, B | Observable<B>>,
    ): Observable<B>
    startWith(value: A): Observable<A>
  }
}

declare module "./EventStream" {
  interface EventStream<A> {
    map<B>(project: Projection<A, B>): EventStream<B>
    filter(predicate: Predicate<A> | Property<any>): EventStream<A>
    take(n: number): EventStream<A>
    first(): EventStream<A>
    flatMapLatest<B>(project: Projection<A, B | Observable<B>>): EventStream<B>
    flatMapFirst<B>(project: Projection<A, B | Observable<B>>): EventStream<B>
    flatMap<B>(project: Projection<A, B | Observable<B>>): EventStream<B>
    flatMapConcat<B>(project: Projection<A, B | Observable<B>>): EventStream<B>
    flatMapWithConcurrencyLimit<B>(
      limit: number,
      project: Projection<A, B | Observable<B>>,
    ): EventStream<B>
    toProperty(initialValue?: A): Property<A>
    startWith(value: A): EventStream<A>
  }
}

declare module "./Property" {
  interface Property<A> {
    map<B>(project: Projection<A, B>): Property<B>
    filter(predicate: Predicate<A> | Property<any>): Property<A>
    take(n: number): Property<A>
    first(): Property<A>
    flatMapLatest<B>(project: Projection<A, B | Observable<B>>): Property<B>
    flatMapFirst<B>(project: Projection<A, B | Observable<B>>): Property<B>
    flatMap<B>(project: Projection<A, B | Observable<B>>): Property<B>
    flatMapConcat<B>(project: Projection<A, B | Observable<B>>): Property<B>
    flatMapWithConcurrencyLimit<B>(
      limit: number,
      project: Projection<A, B | Observable<B>>,
    ): Property<B>
    sampledBy<B>(sampler: EventStream<B>): EventStream<A>
    sampledBy<B>(sampler: Property<B>): Property<A>
    sampledBy<B, C>(sampler: EventStream<B>, f: SampleFn<A, B, C>): EventStream<C>
    sampledBy<B, C>(sampler: Property<B>, f: SampleFn<A, B, C>): Property<C>
    startWith(value: A): Property<A>
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
  project: Projection<A, B> | Property<B>,
  ...rest: any[]
): Observable<B> {
  return Map.map(toFunctionsPropAsIs(project, rest), this)
}

Observable.prototype.filter = function<A>(
  predicate: Predicate<A> | Property<any>,
  ...rest: any[]
): Observable<A> {
  return Filter.filter(toFunctionsPropAsIs(predicate, rest), this)
}

Observable.prototype.take = function<A>(n: number): Observable<A> {
  return Take.take(n, this)
}

Observable.prototype.first = function<A>(): Observable<A> {
  return First.first(this)
}

Observable.prototype.flatMapLatest = function<A, B>(
  project: Projection<A, B | Observable<B>>,
  ...rest: any[]
): Observable<B> {
  return FlatMap.flatMapLatest(toFunction(project, rest), this)
}

Observable.prototype.flatMapFirst = function<A, B>(
  project: Projection<A, B | Observable<B>>,
  ...rest: any[]
): Observable<B> {
  return FlatMap.flatMapFirst(toFunction(project, rest), this)
}

Observable.prototype.flatMap = function<A, B>(
  project: Projection<A, B | Observable<B>>,
  ...rest: any[]
): Observable<B> {
  return FlatMap.flatMap(toFunction(project, rest), this)
}

Observable.prototype.flatMapConcat = function<A, B>(
  project: Projection<A, B | Observable<B>>,
  ...rest: any[]
): Observable<B> {
  return FlatMap.flatMapConcat(toFunction(project, rest), this)
}

Observable.prototype.flatMapWithConcurrencyLimit = function<A, B>(
  limit: number,
  project: Projection<A, B | Observable<B>>,
  ...rest: any[]
): Observable<B> {
  return FlatMap.flatMapWithConcurrencyLimit(limit, toFunction(project, rest), this)
}

Observable.prototype.startWith = function<A>(value: A): Observable<A> {
  return StartWith.startWith(value, this)
}
// EventStream specific operators

EventStream.prototype.toProperty = function<A>(initialValue?: A): Property<A> {
  return arguments.length === 0
    ? ToProperty.toProperty(this)
    : StartWith._startWithP(initialValue, ToProperty.toProperty(this))
}

// Property specific operators

Property.prototype.sampledBy = function<A, B, C>(
  sampler: Observable<B>,
  f?: SampleFn<A, B, C>,
  ...rest: any[]
): any {
  const fn = toFunction(f === undefined ? (v: A, s: B) => v as any : f, rest)
  return Sample.sampleWith(sampler, fn, this)
}

// factory functions

export { once, constant } from "./sources/single"
export { fromArray } from "./sources/fromArray"
export { sequentially } from "./sources/sequentially"
export { fromPoll } from "./sources/fromPoll"
export { later } from "./sources/later"
export { combineAsArray } from "./operators/combine"
export { when } from "./operators/when"
export { fromBinder } from "./sources/fromBinder"

// classes and interfaces

export * from "./_interfaces"
export { Next, Error, End } from "./Event"
export { Observable } from "./Observable"
export { EventStream } from "./EventStream"
export { Property } from "./Property"
