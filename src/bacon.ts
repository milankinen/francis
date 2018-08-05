import { assert } from "./_assert"
import {
  argsToObservables,
  argsToObservablesAndFunction,
  toFunction,
  toFunctionsPropAsIs,
} from "./_interrop"
import * as F from "./index"
import {
  Accum,
  AndResult,
  Dispose,
  EndHandler,
  EndProjection,
  Eq,
  ErrorHandler,
  EventStream,
  Handler,
  Observable,
  OrResult,
  Predicate,
  Projection,
  Property,
  ValueHandler,
  ValuesHandler,
} from "./index"

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
    mapEnd(f: EndProjection<A>): Observable<A>
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
    slidingWindow(max: number, min?: number): Property<A[]>
    skipDuplicates(isEqual?: Eq<A>): Observable<A>
    diff<D>(start: A, f: F.Delta<A, D>): Observable<D>
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
    mapEnd(f: EndProjection<A>): EventStream<A>
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
    skipDuplicates(isEqual?: Eq<A>): EventStream<A>
    diff<D>(start: A, f: F.Delta<A, D>): EventStream<D>
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
    mapEnd(f: EndProjection<A>): Property<A>
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
    and<B>(other: Property<B>): Property<AndResult<A, B>>
    or<B>(other: Property<B>): Property<OrResult<A, B>>
    not<B>(): Property<boolean>
    errors(): Property<A>
    throttle(delay: number): Property<A>
    bufferingThrottle(minimumInterval: number): Property<A>
    skipDuplicates(isEqual?: Eq<A>): Property<A>
    diff<D>(start: A, f: F.Delta<A, D>): Property<D>
  }
}

export type SampleFn<V, S, R> = (value: V, sample: S) => R

/* tslint:disable:no-string-literal */

// Observable operators (common for both EventStream and Property)

Observable.prototype.subscribe = function<A>(handler: Handler<A>, ...rest: any[]): Dispose {
  return F.subscribe(toFunction(handler, rest), this)
}

Observable.prototype.onValue = function<A>(f: ValueHandler<A>, ...rest: any[]): Dispose {
  return F.onValue(toFunction(f, rest), this)
}

Observable.prototype.onValues = function<A>(f: ValuesHandler<A>, ...rest: any[]): Dispose {
  return F.onValues(toFunction(f, rest), this)
}

Observable.prototype.onError = function<A>(f: ErrorHandler, ...rest: any[]): Dispose {
  return F.onError(toFunction(f, rest), this)
}

Observable.prototype.onEnd = function<A>(f: EndHandler, ...rest: any[]): Dispose {
  return F.onEnd(toFunction(f, rest), this)
}

Observable.prototype.assign = function<A>(obj: any, method: string, ...params: any[]): Dispose {
  return F.onValue(toFunction(obj, [method, ...params]), this)
}

Observable.prototype.doAction = function<A>(f: (val: A) => void, ...rest: any[]): Observable<A> {
  return F.doAction(toFunction(f, rest), this)
}

Observable.prototype.doError = function<A>(f: (err: Error) => void, ...rest: any[]): Observable<A> {
  return F.doError(toFunction(f, rest), this)
}

Observable.prototype.doEnd = function<A>(f: () => void, ...rest: any[]): Observable<A> {
  return F.doEnd(toFunction(f, rest), this)
}

Observable.prototype.doLog = function<A>(label?: string): Observable<A> {
  return F.doLog(label, this)
}

Observable.prototype.log = function(label?: string): Dispose {
  return F.log(label, this)
}

Observable.prototype.map = function<A, B>(
  project: Projection<A, B> | Property<B>,
  ...rest: any[]
): Observable<B> {
  return F.map(toFunctionsPropAsIs(project, rest), this)
}

Observable.prototype.mapError = function<A>(
  project: Projection<Error, A>,
  ...rest: any[]
): Observable<A> {
  return F.mapError(toFunction(project, rest), this)
}

Observable.prototype.mapEnd = function<A>(f: EndProjection<A>): Observable<A> {
  return F.mapEnd(f, this)
}

Observable.prototype.filter = function<A>(
  predicate: Predicate<A> | Property<any>,
  ...rest: any[]
): Observable<A> {
  return F.filter(toFunctionsPropAsIs(predicate, rest), this)
}

Observable.prototype.take = function<A>(n: number): Observable<A> {
  return F.take(n, this)
}

Observable.prototype.takeUntil = function<A>(trigger: Observable<any>): Observable<A> {
  return F.takeUntil(trigger, this)
}

Observable.prototype.takeWhile = function<A>(
  f: Predicate<A> | Property<boolean>,
  ...rest: any[]
): Observable<A> {
  return F.takeWhile(toFunctionsPropAsIs(f, rest), this)
}

Observable.prototype.skip = function<A>(n: number): Observable<A> {
  return F.skip(n, this)
}

Observable.prototype.skipUntil = function<A>(trigger: Observable<any>): Observable<A> {
  return F.skipUntil(trigger, this)
}

Observable.prototype.skipWhile = function<A>(
  f: Predicate<A> | Property<boolean>,
  ...rest: any[]
): Observable<A> {
  return F.skipWhile(toFunctionsPropAsIs(f, rest), this)
}

Observable.prototype.skipErrors = function<A>(): Observable<A> {
  return F.skipErrors(this)
}

Observable.prototype.first = function<A>(): Observable<A> {
  return F.first(this)
}

Observable.prototype.last = function<A>(): Observable<A> {
  return F.last(this)
}

Observable.prototype.flatMapLatest = function<A, B>(
  project: Projection<A, B | Observable<B>>,
  ...rest: any[]
): Observable<B> {
  return F.flatMapLatest(toFunction(project, rest), this)
}

Observable.prototype.flatMapFirst = function<A, B>(
  project: Projection<A, B | Observable<B>>,
  ...rest: any[]
): Observable<B> {
  return F.flatMapFirst(toFunction(project, rest), this)
}

Observable.prototype.flatMap = function<A, B>(
  project: Projection<A, B | Observable<B>>,
  ...rest: any[]
): Observable<B> {
  return F.flatMap(toFunction(project, rest), this)
}

Observable.prototype.flatMapConcat = function<A, B>(
  project: Projection<A, B | Observable<B>>,
  ...rest: any[]
): Observable<B> {
  return F.flatMapConcat(toFunction(project, rest), this)
}

Observable.prototype.flatMapWithConcurrencyLimit = function<A, B>(
  limit: number,
  project: Projection<A, B | Observable<B>>,
  ...rest: any[]
): Observable<B> {
  return F.flatMapWithConcurrencyLimit(limit, toFunction(project, rest), this)
}

Observable.prototype.startWith = function<A>(value: A): Observable<A> {
  return F.startWith(value, this)
}

Observable.prototype.scan = function<A, B>(seed: B, f: Accum<B, A>, ...rest: any[]): Property<B> {
  return F.scan(seed, toFunction(f, rest), this)
}

Observable.prototype.fold = Observable.prototype.reduce = function<A, B>(
  seed: B,
  f: Accum<B, A>,
  ...rest: any[]
): Property<B> {
  return F.fold(seed, toFunction(f, rest), this)
}

Observable.prototype.zip = function<A, B, C>(
  other: Observable<B>,
  f: (a: A, b: B) => C,
  ...rest: any[]
): EventStream<C> {
  return F.zipWith(toFunction(f, rest), [this, other])
}

Observable.prototype.merge = function<A>(other: Observable<A>): EventStream<A> {
  return F.mergeAll([this, other])
}

Observable.prototype.concat = function<A>(other: Observable<A>): EventStream<A> {
  return F.concatAll([this, other])
}

Observable.prototype.combine = function<A, B, C>(
  other: Observable<A>,
  f: (a: A, b: B) => C,
  ...rest: any[]
): Property<C> {
  return F.combineWith(toFunction(f, rest), [this, other] as any)
}

Observable.prototype.errors = function<A>(): Observable<A> {
  return F.errors(this)
}

Observable.prototype.throttle = function<A>(delay: number): Observable<A> {
  return F.throttle(delay, this)
}

Observable.prototype.bufferingThrottle = function<A>(minimumInterval: number): Observable<A> {
  return F.bufferingThrottle(minimumInterval, this)
}

Observable.prototype.slidingWindow = function<A>(max: number, min?: number): Property<A[]> {
  return F.slidingWindow(min === undefined ? 0 : min, max, this)
}

Observable.prototype.skipDuplicates = function<A>(isEqual?: Eq<A>): Observable<A> {
  return isEqual === undefined ? F.skipEquals(this) : F.skipDuplicates(isEqual, this)
}

Observable.prototype.diff = function<A, D>(start: A, f: F.Delta<A, D>): Observable<D> {
  return F.diff(f, start, this)
}
// EventStream specific operators

EventStream.prototype.toProperty = function<A>(initialValue?: A): Property<A> {
  return arguments.length === 0 ? F.toProperty(this) : F.startWith(initialValue, F.toProperty(this))
}

const esProto = EventStream.prototype as any
esProto["toEventStream"] = function<A>(): EventStream<A> {
  return this
}

EventStream.prototype.bufferWithTime = function<A>(delay: number): EventStream<A[]> {
  return F.bufferWithTime(delay, this)
}

EventStream.prototype.bufferWithCount = function<A>(count: number): EventStream<A[]> {
  return F.bufferWithCount(count, this)
}

EventStream.prototype.bufferWithTimeOrCount = function<A>(
  delay: number,
  count: number,
): EventStream<A[]> {
  return F.bufferWithTimeOrCount(delay, count, this)
}

// Property specific operators

Property.prototype.sampledBy = function<A, B, C>(
  sampler: Observable<B>,
  f?: SampleFn<A, B, C>,
  ...rest: any[]
): any {
  const fn = toFunction(f === undefined ? (v: A, s: B) => v as any : f, rest)
  return F.sampleWith(sampler, fn, this)
}

Property.prototype.sample = function<A>(i: number): EventStream<A> {
  return F.sampleBy(F.interval(i, null as any), this)
}

Property.prototype.and = function<A, B>(other: Property<B>): Property<AndResult<A, B>> {
  return F.and(this, other)
}

Property.prototype.or = function<A, B>(other: Property<B>): Property<OrResult<A, B>> {
  return F.or(this, other)
}

Property.prototype.not = function<A>(): Property<boolean> {
  return F.not(this)
}

const pProto = Property.prototype as any
pProto["toProperty"] = function<A>(initialValue?: A): Property<A> {
  assert(arguments.length === 0, "No arguments supported")
  return this
}

Property.prototype.toEventStream = function<A>(): EventStream<A> {
  return F.toEventStream(this)
}

Property.prototype.changes = function<A>(): EventStream<A> {
  return F.changes(this)
}

// static operators

export { End, Error, Next } from "./Event"
export { EventStream } from "./EventStream"
export { Observable } from "./Observable"
export { Combineable, combineAsArray, combineTemplate } from "./operators/combine"
export { update } from "./operators/update"
export { when } from "./operators/when"
export { zipAsArray } from "./operators/zip"
export { Property } from "./Property"
export { fromArray } from "./sources/fromArray"
export { fromBinder } from "./sources/fromBinder"
export { fromEvent } from "./sources/fromEvent"
export { fromCallback, fromNodeCallback } from "./sources/fromCallback"
export { fromPoll } from "./sources/fromPoll"
export { interval } from "./sources/interval"
export { later } from "./sources/later"
export { never } from "./sources/never"
export { repeat } from "./sources/repeat"
export { repeatedly } from "./sources/repeatedly"
export { sequentially } from "./sources/sequentially"
export { constant, once } from "./sources/single"
// classes and interfaces
export * from "./_interfaces"

// tslint:disable:no-shadowed-variable

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
  return F.zipWith(f, observables as any)
}

export function combineWith<A, R>(f: (a: A) => R, observables: [F.Combineable<A>]): Property<R>
export function combineWith<A, B, R>(
  f: (a: A, b: B) => R,
  observables: [F.Combineable<A>, F.Combineable<B>],
): Property<R>
export function combineWith<A, B, C, R>(
  f: (a: A, b: B, c: C) => R,
  observables: [F.Combineable<A>, F.Combineable<B>, F.Combineable<C>],
): Property<R>
export function combineWith<A, B, C, D, R>(
  f: (a: A, b: B, c: C, d: D) => R,
  observables: [F.Combineable<A>, F.Combineable<B>, F.Combineable<C>, F.Combineable<D>],
): Property<R>
export function combineWith<A, B, C, D, E, R>(
  f: (a: A, b: B, c: C, d: D, e: E) => R,
  observables: [
    F.Combineable<A>,
    F.Combineable<B>,
    F.Combineable<C>,
    F.Combineable<D>,
    F.Combineable<E>
  ],
): Property<R>
export function combineWith<A, B, C, D, E, F, R>(
  f: (a: A, b: B, c: C, d: D, e: E, f: F) => R,
  observables: [
    F.Combineable<A>,
    F.Combineable<B>,
    F.Combineable<C>,
    F.Combineable<D>,
    F.Combineable<E>,
    F.Combineable<F>
  ],
): Property<R>
export function combineWith<A, R>(observables: [F.Combineable<A>], f: (a: A) => R): Property<R>
export function combineWith<A, B, R>(
  observables: [F.Combineable<A>, F.Combineable<B>],
  f: (a: A, b: B) => R,
): Property<R>
export function combineWith<A, B, C, R>(
  observables: [F.Combineable<A>, F.Combineable<B>, F.Combineable<C>],
  f: (a: A, b: B, c: C) => R,
): Property<R>
export function combineWith<A, B, C, D, R>(
  observables: [F.Combineable<A>, F.Combineable<B>, F.Combineable<C>, F.Combineable<D>],
  f: (a: A, b: B, c: C, d: D) => R,
): Property<R>
export function combineWith<A, B, C, D, E, R>(
  observables: [
    F.Combineable<A>,
    F.Combineable<B>,
    F.Combineable<C>,
    F.Combineable<D>,
    F.Combineable<E>
  ],
  f: (a: A, b: B, c: C, d: D, e: E) => R,
): Property<R>
export function combineWith<A, B, C, D, E, F, R>(
  observables: [
    F.Combineable<A>,
    F.Combineable<B>,
    F.Combineable<C>,
    F.Combineable<D>,
    F.Combineable<E>,
    F.Combineable<F>
  ],
  f: (a: A, b: B, c: C, d: D, e: E, f: F) => R,
): Property<R>
export function combineWith<T, R>(...args: any[]): Property<R> {
  const [observables, f] = argsToObservablesAndFunction(args)
  return F.combineWith(f, observables as any)
}

export function concatAll<T>(...observables: Array<Observable<T>>): EventStream<T>
export function concatAll<T>(observables: Array<Observable<T>>): EventStream<T>
export function concatAll<T>(
  observables: Array<Observable<T>> | Observable<T>,
  ...rest: Array<Observable<T>>
): EventStream<T> {
  return F.concatAll(argsToObservables([observables, ...rest]) as Array<EventStream<T>>)
}

export function mergeAll<T>(...observables: Array<Observable<T>>): EventStream<T>
export function mergeAll<T>(observables: Array<Observable<T>>): EventStream<T>
export function mergeAll<T>(
  observables: Array<Observable<T>> | Observable<T>,
  ...rest: Array<Observable<T>>
): EventStream<T> {
  return F.mergeAll(argsToObservables([observables, ...rest]))
}
