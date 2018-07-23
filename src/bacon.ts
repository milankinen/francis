import { assert } from "./_assert"
import { Accum, Dispose, Handler, Predicate, Projection, ValueHandler } from "./_interfaces"
import {
  argsToObservables,
  argsToObservablesAndFunction,
  toFunction,
  toFunctionsPropAsIs,
} from "./_interrop"
import { EventStream } from "./EventStream"
import { Observable } from "./Observable"
import * as Concat from "./operators/concat"
import * as Filter from "./operators/filter"
import * as First from "./operators/first"
import * as FlatMap from "./operators/flatMap"
import * as Last from "./operators/last"
import * as Log from "./operators/log"
import * as Logic from "./operators/logic"
import * as Map from "./operators/map"
import * as Merge from "./operators/merge"
import * as OnValue from "./operators/onValue"
import * as Sample from "./operators/sample"
import * as Scan from "./operators/scan"
import * as StartWith from "./operators/startWith"
import * as Subscribe from "./operators/subscribe"
import * as Take from "./operators/take"
import * as ToEventStream from "./operators/toEventStream"
import * as ToProperty from "./operators/toProperty"
import * as Zip from "./operators/zip"
import { Property } from "./Property"

declare module "./Observable" {
  interface Observable<A> {
    subscribe(handler: Handler<A>): Dispose
    onValue(f: ValueHandler<A>): Dispose
    log(label?: string): Dispose
    map<B>(project: Projection<A, B>): Observable<B>
    filter(predicate: Predicate<A> | Property<any>): Observable<A>
    take(n: number): Observable<A>
    first(): Observable<A>
    last(): Observable<A>
    flatMapLatest<B>(project: Projection<A, B | Observable<B>>): Observable<B>
    flatMapFirst<B>(project: Projection<A, B | Observable<B>>): Observable<B>
    flatMap<B>(project: Projection<A, B | Observable<B>>): Observable<B>
    flatMapConcat<B>(project: Projection<A, B | Observable<B>>): Observable<B>
    flatMapWithConcurrencyLimit<B>(
      limit: number,
      project: Projection<A, B | Observable<B>>,
    ): Observable<B>
    startWith(value: A): Observable<A>
    scan<B>(seed: B, f: Accum<B, A>): Property<B>
    zip<B, C>(other: Observable<B>, f: (a: A, b: B) => C): EventStream<C>
    merge(other: Observable<A>): EventStream<A>
    concat(other: Observable<A>): EventStream<A>
  }
}

declare module "./EventStream" {
  interface EventStream<A> {
    toProperty(initialValue?: A): Property<A>
    map<B>(project: Projection<A, B>): EventStream<B>
    filter(predicate: Predicate<A> | Property<any>): EventStream<A>
    take(n: number): EventStream<A>
    first(): EventStream<A>
    last(): EventStream<A>
    flatMapLatest<B>(project: Projection<A, B | Observable<B>>): EventStream<B>
    flatMapFirst<B>(project: Projection<A, B | Observable<B>>): EventStream<B>
    flatMap<B>(project: Projection<A, B | Observable<B>>): EventStream<B>
    flatMapConcat<B>(project: Projection<A, B | Observable<B>>): EventStream<B>
    flatMapWithConcurrencyLimit<B>(
      limit: number,
      project: Projection<A, B | Observable<B>>,
    ): EventStream<B>
    startWith(value: A): EventStream<A>
  }
}

declare module "./Property" {
  interface Property<A> {
    toEventStream(): EventStream<A>
    map<B>(project: Projection<A, B>): Property<B>
    filter(predicate: Predicate<A> | Property<any>): Property<A>
    take(n: number): Property<A>
    first(): Property<A>
    last(): Property<A>
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
    and<B>(other: Property<B>): Property<Logic.AndResult<A, B>>
    or<B>(other: Property<B>): Property<Logic.OrResult<A, B>>
    not<B>(): Property<boolean>
  }
}

export type SampleFn<V, S, R> = (value: V, sample: S) => R

/* tslint:disable:no-string-literal */

// Observable operators (common for both EventStream and Property)

Observable.prototype["subscribe"] = function<A>(handler: Handler<A>): Dispose {
  return Subscribe.subscribe(handler, this)
}

Observable.prototype["onValue"] = function<A>(f: ValueHandler<A>): Dispose {
  return OnValue.onValue(f, this)
}

Observable.prototype["log"] = function(label?: string): Dispose {
  return Log.log(label, this)
}

Observable.prototype["map"] = function<A, B>(
  project: Projection<A, B> | Property<B>,
  ...rest: any[]
): Observable<B> {
  return Map.map(toFunctionsPropAsIs(project, rest), this)
}

Observable.prototype["filter"] = function<A>(
  predicate: Predicate<A> | Property<any>,
  ...rest: any[]
): Observable<A> {
  return Filter.filter(toFunctionsPropAsIs(predicate, rest), this)
}

Observable.prototype.take = function<A>(n: number): Observable<A> {
  return Take.take(n, this)
}

Observable.prototype["first"] = function<A>(): Observable<A> {
  return First.first(this)
}

Observable.prototype["last"] = function<A>(): Observable<A> {
  return Last.last(this)
}

Observable.prototype["flatMapLatest"] = function<A, B>(
  project: Projection<A, B | Observable<B>>,
  ...rest: any[]
): Observable<B> {
  return FlatMap.flatMapLatest(toFunction(project, rest), this)
}

Observable.prototype["flatMapFirst"] = function<A, B>(
  project: Projection<A, B | Observable<B>>,
  ...rest: any[]
): Observable<B> {
  return FlatMap.flatMapFirst(toFunction(project, rest), this)
}

Observable.prototype["flatMap"] = function<A, B>(
  project: Projection<A, B | Observable<B>>,
  ...rest: any[]
): Observable<B> {
  return FlatMap.flatMap(toFunction(project, rest), this)
}

Observable.prototype["flatMapConcat"] = function<A, B>(
  project: Projection<A, B | Observable<B>>,
  ...rest: any[]
): Observable<B> {
  return FlatMap.flatMapConcat(toFunction(project, rest), this)
}

Observable.prototype["flatMapWithConcurrencyLimit"] = function<A, B>(
  limit: number,
  project: Projection<A, B | Observable<B>>,
  ...rest: any[]
): Observable<B> {
  return FlatMap.flatMapWithConcurrencyLimit(limit, toFunction(project, rest), this)
}

Observable.prototype["startWith"] = function<A>(value: A): Observable<A> {
  return StartWith.startWith(value, this)
}

Observable.prototype["scan"] = function<A, B>(
  seed: B,
  f: Accum<B, A>,
  ...rest: any[]
): Property<B> {
  return Scan.scan(seed, toFunction(f, rest), this)
}

Observable.prototype["zip"] = function<A, B, C>(
  other: Observable<B>,
  f: (a: A, b: B) => C,
  ...rest: any[]
): EventStream<C> {
  return Zip.zipWith(toFunction(f, rest), [this, other])
}

Observable.prototype["merge"] = function<A>(other: Observable<A>): EventStream<A> {
  return Merge.mergeAll([this, other])
}

Observable.prototype["concat"] = function<A>(other: Observable<A>): EventStream<A> {
  return Concat.concatAll([this, other])
}

// EventStream specific operators

EventStream.prototype["toProperty"] = function<A>(initialValue?: A): Property<A> {
  return arguments.length === 0
    ? ToProperty.toProperty(this)
    : StartWith._startWithP(initialValue, ToProperty.toProperty(this))
}

const esProto = EventStream.prototype as any
esProto["toEventStream"] = function<A>(): EventStream<A> {
  return this
}

// Property specific operators

Property.prototype["sampledBy"] = function<A, B, C>(
  sampler: Observable<B>,
  f?: SampleFn<A, B, C>,
  ...rest: any[]
): any {
  const fn = toFunction(f === undefined ? (v: A, s: B) => v as any : f, rest)
  return Sample.sampleWith(sampler, fn, this)
}

Property.prototype["and"] = function<A, B>(other: Property<B>): Property<Logic.AndResult<A, B>> {
  return Logic.and(this, other)
}

Property.prototype["or"] = function<A, B>(other: Property<B>): Property<Logic.OrResult<A, B>> {
  return Logic.or(this, other)
}

Property.prototype["not"] = function<A>(): Property<boolean> {
  return Logic.not(this)
}

const pProto = Property.prototype as any
pProto["toProperty"] = function<A>(initialValue?: A): Property<A> {
  assert(arguments.length === 0, "No arguments supported")
  return this
}

Property.prototype["toEventStream"] = function<A>(): EventStream<A> {
  return ToEventStream.toEventStream(this)
}

// static operators

export { End, Error, Next } from "./Event"
export { EventStream } from "./EventStream"
export { Observable } from "./Observable"
export { combineAsArray, combineTemplate } from "./operators/combine"
export { when } from "./operators/when"
export { zipAsArray } from "./operators/zip"
export { Property } from "./Property"
export { fromArray } from "./sources/fromArray"
export { fromBinder } from "./sources/fromBinder"
export { fromPoll } from "./sources/fromPoll"
export { later } from "./sources/later"
export { never } from "./sources/never"
export { sequentially } from "./sources/sequentially"
export { constant, once } from "./sources/single"
// classes and interfaces
export * from "./_interfaces"

export function zipWith<A, T>(f: (a: A) => T, streams: [Observable<A>]): EventStream<T>
export function zipWith<A, B, T>(
  f: (a: A, b: B) => T,
  streams: [Observable<A>, Observable<B>],
): EventStream<T>
export function zipWith<A, B, C, T>(
  f: (a: A, b: B, c: C) => T,
  streams: [Observable<A>, Observable<B>, Observable<C>],
): EventStream<T>
export function zipWith<A, B, C, D, T>(
  f: (a: A, b: B, c: C, d: D) => T,
  streams: [Observable<A>, Observable<B>, Observable<C>, Observable<D>],
): EventStream<T>
export function zipWith<A, B, C, D, E, T>(
  f: (a: A, b: B, c: C, d: D, e: E) => T,
  streams: [Observable<A>, Observable<B>, Observable<C>, Observable<D>, Observable<E>],
): EventStream<T>
export function zipWith<A, B, C, D, E, F, T>(
  f: (a: A, b: B, c: C, d: D, e: E, f: F) => T,
  streams: [
    Observable<A>,
    Observable<B>,
    Observable<C>,
    Observable<D>,
    Observable<E>,
    Observable<F>
  ],
): EventStream<T>
export function zipWith<A, T>(f: (...args: A[]) => T, streams: A[]): EventStream<T>
export function zipWith<A, T>(f: (streams: [Observable<A>], a: A) => T): EventStream<T>
export function zipWith<A, B, T>(
  streams: [Observable<A>, Observable<B>],
  f: (a: A, b: B) => T,
): EventStream<T>
export function zipWith<A, B, C, T>(
  streams: [Observable<A>, Observable<B>, Observable<C>],
  f: (a: A, b: B, c: C) => T,
): EventStream<T>
export function zipWith<A, B, C, D, T>(
  streams: [Observable<A>, Observable<B>, Observable<C>, Observable<D>],
  f: (a: A, b: B, c: C, d: D) => T,
): EventStream<T>
export function zipWith<A, B, C, D, E, T>(
  streams: [Observable<A>, Observable<B>, Observable<C>, Observable<D>, Observable<E>],
  f: (a: A, b: B, c: C, d: D, e: E) => T,
): EventStream<T>
export function zipWith<A, B, C, D, E, F, T>(
  streams: [
    Observable<A>,
    Observable<B>,
    Observable<C>,
    Observable<D>,
    Observable<E>,
    Observable<F>
  ],
  f: (a: A, b: B, c: C, d: D, e: E, f: F) => T,
): EventStream<T>
export function zipWith<A, T>(streams: A[], f: (...args: A[]) => T): EventStream<T>
export function zipWith(...args: any[]): EventStream<any> {
  const [observables, f] = argsToObservablesAndFunction(args)
  return Zip.zipWith(f, observables as any)
}

export function concatAll<T>(...observables: Array<Observable<T>>): EventStream<T>
export function concatAll<T>(observables: Array<Observable<T>>): EventStream<T>
export function concatAll<T>(
  observables: Array<Observable<T>> | Observable<T>,
  ...rest: Array<Observable<T>>
): EventStream<T> {
  return Concat.concatAll(argsToObservables([observables, ...rest]) as Array<EventStream<T>>)
}

export function mergeAll<T>(...observables: Array<Observable<T>>): EventStream<T>
export function mergeAll<T>(observables: Array<Observable<T>>): EventStream<T>
export function mergeAll<T>(
  observables: Array<Observable<T>> | Observable<T>,
  ...rest: Array<Observable<T>>
): EventStream<T> {
  return Merge.mergeAll(argsToObservables([observables, ...rest]))
}
