import { assert } from "./_assert"
import {
  Accum,
  Dispose,
  EndHandler,
  ErrorHandler,
  Handler,
  Predicate,
  Projection,
  ValueHandler,
  ValuesHandler,
} from "./_interfaces"
import {
  argsToObservables,
  argsToObservablesAndFunction,
  toFunction,
  toFunctionsPropAsIs,
} from "./_interrop"
import { EventStream } from "./EventStream"
import { Observable } from "./Observable"
import * as Buffer from "./operators/buffer"
import * as Changes from "./operators/changes"
import * as Combine from "./operators/combine"
import * as Concat from "./operators/concat"
import * as Do from "./operators/do"
import * as Errors from "./operators/errors"
import * as Filter from "./operators/filter"
import * as First from "./operators/first"
import * as FlatMap from "./operators/flatMap"
import * as Fold from "./operators/fold"
import * as Last from "./operators/last"
import * as Log from "./operators/log"
import * as Logic from "./operators/logic"
import * as Map from "./operators/map"
import * as MapEnd from "./operators/mapEnd"
import * as MapError from "./operators/mapError"
import * as Merge from "./operators/merge"
import * as Sample from "./operators/sample"
import * as Scan from "./operators/scan"
import * as Skip from "./operators/skip"
import * as SkipErrors from "./operators/skipErrors"
import * as SkipUntil from "./operators/skipUntil"
import * as SkipWhile from "./operators/skipWhile"
import * as StartWith from "./operators/startWith"
import * as Subscribe from "./operators/subscribe"
import * as Take from "./operators/take"
import * as TakeUntil from "./operators/takeUntil"
import * as TakeWhile from "./operators/takeWhile"
import * as Throttle from "./operators/throttle"
import * as ToEventStream from "./operators/toEventStream"
import * as ToProperty from "./operators/toProperty"
import * as Zip from "./operators/zip"
import { Property } from "./Property"
import { interval } from "./sources/interval"

declare module "./Observable" {
  interface Observable<A> {
    subscribe(handler: Handler<A>): Dispose
    onValue(f: ValueHandler<A>): Dispose
    onValues(f: ValuesHandler<A>): Dispose
    onError(f: ErrorHandler): Dispose
    onEnd(f: EndHandler): Dispose
    doAction(f: (val: A) => void): Observable<A>
    doError(f: (err: Error) => void): Observable<A>
    doEnd(f: () => void): Observable<A>
    doLog(label?: string): Observable<A>
    assign(obj: any, method: string, ...params: any[]): Dispose
    log(label?: string): Dispose
    map<B>(project: Projection<A, B>): Observable<B>
    mapError<A>(project: Projection<Error, A>): Observable<A>
    mapEnd(f: MapEnd.EndProjection<A>): Observable<A>
    filter(predicate: Predicate<A> | Property<any>): Observable<A>
    take(n: number): Observable<A>
    takeUntil(trigger: Observable<any>): Observable<A>
    takeWhile(f: Predicate<A> | Property<boolean>): Observable<A>
    first(): Observable<A>
    last(): Observable<A>
    skip(n: number): Observable<A>
    skipUntil(trigger: Observable<any>): Observable<A>
    skipWhile(trigger: Predicate<A> | Property<boolean>): Observable<A>
    skipErrors(): Observable<A>
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
    fold<B>(seed: B, f: Accum<B, A>): Property<B>
    reduce<B>(seed: B, f: Accum<B, A>): Property<B>
    zip<B, C>(other: Observable<B>, f: (a: A, b: B) => C): EventStream<C>
    merge(other: Observable<A>): EventStream<A>
    concat(other: Observable<A>): EventStream<A>
    combine<B, C>(other: Observable<B>, f: (a: A, b: B) => C): Property<C>
    errors(): Observable<A>
    throttle(delay: number): Observable<A>
    bufferingThrottle(minimumInterval: number): Observable<A>
  }
}

declare module "./EventStream" {
  interface EventStream<A> {
    toProperty(initialValue?: A): Property<A>
    doAction(f: (val: A) => void): EventStream<A>
    doError(f: (err: Error) => void): EventStream<A>
    doEnd(f: () => void): EventStream<A>
    doLog(label?: string): EventStream<A>
    map<B>(project: Projection<A, B>): EventStream<B>
    mapError<A>(project: Projection<Error, A>): EventStream<A>
    mapEnd(f: A | MapEnd.EndProjection<A>): EventStream<A>
    filter(predicate: Predicate<A> | Property<any>): EventStream<A>
    take(n: number): EventStream<A>
    takeUntil(trigger: Observable<any>): EventStream<A>
    takeWhile(f: Predicate<A> | Property<boolean>): EventStream<A>
    first(): EventStream<A>
    last(): EventStream<A>
    skip(n: number): EventStream<A>
    skipUntil(trigger: Observable<any>): EventStream<A>
    skipWhile(trigger: Predicate<A> | Property<boolean>): EventStream<A>
    skipErrors(): EventStream<A>
    flatMapLatest<B>(project: Projection<A, B | Observable<B>>): EventStream<B>
    flatMapFirst<B>(project: Projection<A, B | Observable<B>>): EventStream<B>
    flatMap<B>(project: Projection<A, B | Observable<B>>): EventStream<B>
    flatMapConcat<B>(project: Projection<A, B | Observable<B>>): EventStream<B>
    flatMapWithConcurrencyLimit<B>(
      limit: number,
      project: Projection<A, B | Observable<B>>,
    ): EventStream<B>
    startWith(value: A): EventStream<A>
    errors(): EventStream<A>
    throttle(delay: number): EventStream<A>
    bufferingThrottle(minimumInterval: number): EventStream<A>
    bufferWithTime(delay: number): EventStream<A[]>
    bufferWithCount(count: number): EventStream<A[]>
    bufferWithTimeOrCount(delay: number, count: number): EventStream<A[]>
  }
}

declare module "./Property" {
  interface Property<A> {
    toEventStream(): EventStream<A>
    changes(): EventStream<A>
    doAction(f: (val: A) => void): Property<A>
    doError(f: (err: Error) => void): Property<A>
    doEnd(f: () => void): Property<A>
    doLog(label?: string): Property<A>
    map<B>(project: Projection<A, B>): Property<B>
    mapError<A>(project: Projection<Error, A>): Property<A>
    mapEnd(f: MapEnd.EndProjection<A>): Property<A>
    filter(predicate: Predicate<A> | Property<any>): Property<A>
    take(n: number): Property<A>
    takeUntil(trigger: Observable<any>): Property<A>
    takeWhile(f: Predicate<A> | Property<boolean>): Property<A>
    first(): Property<A>
    last(): Property<A>
    skip(n: number): Property<A>
    skipUntil(trigger: Observable<any>): Property<A>
    skipWhile(trigger: Predicate<A> | Property<boolean>): Property<A>
    skipErrors(): Property<A>
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
    sample(interval: number): EventStream<A>
    startWith(value: A): Property<A>
    and<B>(other: Property<B>): Property<Logic.AndResult<A, B>>
    or<B>(other: Property<B>): Property<Logic.OrResult<A, B>>
    not<B>(): Property<boolean>
    errors(): Property<A>
    throttle(delay: number): Property<A>
    bufferingThrottle(minimumInterval: number): Property<A>
  }
}

export type SampleFn<V, S, R> = (value: V, sample: S) => R

/* tslint:disable:no-string-literal */

// Observable operators (common for both EventStream and Property)

Observable.prototype["subscribe"] = function<A>(handler: Handler<A>, ...rest: any[]): Dispose {
  return Subscribe.subscribe(toFunction(handler, rest), this)
}

Observable.prototype["onValue"] = function<A>(f: ValueHandler<A>, ...rest: any[]): Dispose {
  return Subscribe.onValue(toFunction(f, rest), this)
}

Observable.prototype["onValues"] = function<A>(f: ValuesHandler<A>, ...rest: any[]): Dispose {
  return Subscribe.onValues(toFunction(f, rest), this)
}

Observable.prototype["onError"] = function<A>(f: ErrorHandler, ...rest: any[]): Dispose {
  return Subscribe.onError(toFunction(f, rest), this)
}

Observable.prototype["onEnd"] = function<A>(f: EndHandler, ...rest: any[]): Dispose {
  return Subscribe.onEnd(toFunction(f, rest), this)
}

Observable.prototype["assign"] = function<A>(obj: any, method: string, ...params: any[]): Dispose {
  return Subscribe.onValue(toFunction(obj, [method, ...params]), this)
}

Observable.prototype["doAction"] = function<A>(f: (val: A) => void, ...rest: any[]): Observable<A> {
  return Do.doAction(toFunction(f, rest), this)
}

Observable.prototype["doError"] = function<A>(
  f: (err: Error) => void,
  ...rest: any[]
): Observable<A> {
  return Do.doError(toFunction(f, rest), this)
}

Observable.prototype["doEnd"] = function<A>(f: () => void, ...rest: any[]): Observable<A> {
  return Do.doEnd(toFunction(f, rest), this)
}

Observable.prototype["doLog"] = function<A>(label?: string): Observable<A> {
  return Do.doLog(label, this)
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

Observable.prototype["mapError"] = function<A>(
  project: Projection<Error, A>,
  ...rest: any[]
): Observable<A> {
  return MapError.mapError(toFunction(project, rest), this)
}

Observable.prototype["mapEnd"] = function<A>(f: MapEnd.EndProjection<A>): Observable<A> {
  return MapEnd.mapEnd(f, this)
}

Observable.prototype["filter"] = function<A>(
  predicate: Predicate<A> | Property<any>,
  ...rest: any[]
): Observable<A> {
  return Filter.filter(toFunctionsPropAsIs(predicate, rest), this)
}

Observable.prototype["take"] = function<A>(n: number): Observable<A> {
  return Take.take(n, this)
}

Observable.prototype["takeUntil"] = function<A>(trigger: Observable<any>): Observable<A> {
  return TakeUntil.takeUntil(trigger, this)
}

Observable.prototype["takeWhile"] = function<A>(
  f: Predicate<A> | Property<boolean>,
  ...rest: any[]
): Observable<A> {
  return TakeWhile.takeWhile(toFunctionsPropAsIs(f, rest), this)
}

Observable.prototype["skip"] = function<A>(n: number): Observable<A> {
  return Skip.skip(n, this)
}

Observable.prototype["skipUntil"] = function<A>(trigger: Observable<any>): Observable<A> {
  return SkipUntil.skipUntil(trigger, this)
}

Observable.prototype["skipWhile"] = function<A>(
  f: Predicate<A> | Property<boolean>,
  ...rest: any[]
): Observable<A> {
  return SkipWhile.skipWhile(toFunctionsPropAsIs(f, rest), this)
}

Observable.prototype["skipErrors"] = function<A>(): Observable<A> {
  return SkipErrors.skipErrors(this)
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

Observable.prototype["fold"] = Observable.prototype["reduce"] = function<A, B>(
  seed: B,
  f: Accum<B, A>,
  ...rest: any[]
): Property<B> {
  return Fold.fold(seed, toFunction(f, rest), this)
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

Observable.prototype["combine"] = function<A, B, C>(
  other: Observable<A>,
  f: (a: A, b: B) => C,
  ...rest: any[]
): Property<C> {
  return Combine.combineWith(toFunction(f, rest), [this, other] as any)
}

Observable.prototype["errors"] = function<A>(): Observable<A> {
  return Errors.errors(this)
}

Observable.prototype["throttle"] = function<A>(delay: number): Observable<A> {
  return Throttle.throttle(delay, this)
}

Observable.prototype["bufferingThrottle"] = function<A>(minimumInterval: number): Observable<A> {
  return Throttle.bufferingThrottle(minimumInterval, this)
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

EventStream.prototype["bufferWithTime"] = function<A>(delay: number): EventStream<A[]> {
  return Buffer.bufferWithTime(delay, this)
}

EventStream.prototype["bufferWithCount"] = function<A>(count: number): EventStream<A[]> {
  return Buffer.bufferWithCount(count, this)
}

EventStream.prototype["bufferWithTimeOrCount"] = function<A>(
  delay: number,
  count: number,
): EventStream<A[]> {
  return Buffer.bufferWithTimeOrCount(delay, count, this)
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

Property.prototype["sample"] = function<A>(i: number): EventStream<A> {
  return Sample.sampleBy(interval(i, null as any), this)
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

Property.prototype["changes"] = function<A>(): EventStream<A> {
  return Changes.changes(this)
}

// static operators

export { End, Error, Next } from "./Event"
export { EventStream } from "./EventStream"
export { Observable } from "./Observable"
export { combineAsArray, combineTemplate } from "./operators/combine"
export { when } from "./operators/when"
export { zipAsArray } from "./operators/zip"
export { update } from "./operators/update"
export { Property } from "./Property"
export { fromArray } from "./sources/fromArray"
export { fromBinder } from "./sources/fromBinder"
export { fromEvent } from "./sources/fromEvent"
export { fromPoll } from "./sources/fromPoll"
export { interval } from "./sources/interval"
export { later } from "./sources/later"
export { never } from "./sources/never"
export { sequentially } from "./sources/sequentially"
export { constant, once } from "./sources/single"
export { repeat } from "./sources/repeat"
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

export function combineWith<A, R>(
  f: (a: A) => R,
  observables: [Combine.Combineable<A>],
): Property<R>
export function combineWith<A, B, R>(
  f: (a: A, b: B) => R,
  observables: [Combine.Combineable<A>, Combine.Combineable<B>],
): Property<R>
export function combineWith<A, B, C, R>(
  f: (a: A, b: B, c: C) => R,
  observables: [Combine.Combineable<A>, Combine.Combineable<B>, Combine.Combineable<C>],
): Property<R>
export function combineWith<A, B, C, D, R>(
  f: (a: A, b: B, c: C, d: D) => R,
  observables: [
    Combine.Combineable<A>,
    Combine.Combineable<B>,
    Combine.Combineable<C>,
    Combine.Combineable<D>
  ],
): Property<R>
export function combineWith<A, B, C, D, E, R>(
  f: (a: A, b: B, c: C, d: D, e: E) => R,
  observables: [
    Combine.Combineable<A>,
    Combine.Combineable<B>,
    Combine.Combineable<C>,
    Combine.Combineable<D>,
    Combine.Combineable<E>
  ],
): Property<R>
export function combineWith<A, B, C, D, E, F, R>(
  f: (a: A, b: B, c: C, d: D, e: E, f: F) => R,
  observables: [
    Combine.Combineable<A>,
    Combine.Combineable<B>,
    Combine.Combineable<C>,
    Combine.Combineable<D>,
    Combine.Combineable<E>,
    Combine.Combineable<F>
  ],
): Property<R>
export function combineWith<A, R>(
  observables: [Combine.Combineable<A>],
  f: (a: A) => R,
): Property<R>
export function combineWith<A, B, R>(
  observables: [Combine.Combineable<A>, Combine.Combineable<B>],
  f: (a: A, b: B) => R,
): Property<R>
export function combineWith<A, B, C, R>(
  observables: [Combine.Combineable<A>, Combine.Combineable<B>, Combine.Combineable<C>],
  f: (a: A, b: B, c: C) => R,
): Property<R>
export function combineWith<A, B, C, D, R>(
  observables: [
    Combine.Combineable<A>,
    Combine.Combineable<B>,
    Combine.Combineable<C>,
    Combine.Combineable<D>
  ],
  f: (a: A, b: B, c: C, d: D) => R,
): Property<R>
export function combineWith<A, B, C, D, E, R>(
  observables: [
    Combine.Combineable<A>,
    Combine.Combineable<B>,
    Combine.Combineable<C>,
    Combine.Combineable<D>,
    Combine.Combineable<E>
  ],
  f: (a: A, b: B, c: C, d: D, e: E) => R,
): Property<R>
export function combineWith<A, B, C, D, E, F, R>(
  observables: [
    Combine.Combineable<A>,
    Combine.Combineable<B>,
    Combine.Combineable<C>,
    Combine.Combineable<D>,
    Combine.Combineable<E>,
    Combine.Combineable<F>
  ],
  f: (a: A, b: B, c: C, d: D, e: E, f: F) => R,
): Property<R>
export function combineWith<T, R>(...args: any[]): Property<R> {
  const [observables, f] = argsToObservablesAndFunction(args)
  return Combine.combineWith(f, observables as any)
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
