import { Dispose, Handler, Predicate, Projection } from "./_interfaces"
import { identity } from "./_util"
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
import * as Zip from "./operators/zip"
import { AnyObs, Property } from "./Property"

declare module "./Observable" {
  interface Observable<A> {
    subscribe(handler: Handler<A>): Dispose
    log(label?: string): Dispose
    map<B>(project: Projection<A, B>): Observable<B>
    filter(predicate: Predicate<A>): Observable<A>
    take(n: number): Observable<A>
    first(): Observable<A>
    flatMapLatest<B>(project: Projection<A, Observable<B>>): Observable<B>
    zipAsArray<B>(s1: Observable<B>): Observable<[A, B]>
    zipAsArray<B, C>(s1: Observable<B>, s2: Observable<C>): Observable<[A, B, C]>
    zipAsArray<B, C, D>(
      s1: Observable<B>,
      s2: Observable<C>,
      s3: Observable<D>,
    ): Observable<[A, B, C, D]>
    zipAsArray<B, C, D, E>(
      s1: Observable<B>,
      s2: Observable<C>,
      s3: Observable<D>,
      s4: Observable<E>,
    ): Observable<[A, B, C, D, E]>
    zipAsArray<B, C, D, E, F>(
      s1: Observable<B>,
      s2: Observable<C>,
      s3: Observable<D>,
      s4: Observable<E>,
      s5: Observable<F>,
    ): Observable<[A, B, C, D, E, F]>
    zipAsArray(...other: Array<Observable<any>>): Observable<any[]>
  }
}

declare module "./EventStream" {
  interface EventStream<A> {
    map<B>(project: Projection<A, B>): EventStream<B>
    filter(predicate: Predicate<A>): EventStream<A>
    take(n: number): EventStream<A>
    first(): EventStream<A>
    flatMapLatest<B>(project: Projection<A, Observable<B>>): EventStream<B>
    toProperty(initialValue: A): Property<A>
    zipAsArray<B>(s1: AnyObs<B>): EventStream<[A, B]>
    zipAsArray<B, C>(s1: AnyObs<B>, s2: AnyObs<C>): EventStream<[A, B, C]>
    zipAsArray<B, C, D>(s1: AnyObs<B>, s2: AnyObs<C>, s3: AnyObs<D>): EventStream<[A, B, C, D]>
    zipAsArray<B, C, D, E>(
      s1: AnyObs<B>,
      s2: AnyObs<C>,
      s3: AnyObs<D>,
      s4: AnyObs<E>,
    ): EventStream<[A, B, C, D, E]>
    zipAsArray<B, C, D, E, F>(
      s1: AnyObs<B>,
      s2: AnyObs<C>,
      s3: AnyObs<D>,
      s4: AnyObs<E>,
      s5: AnyObs<F>,
    ): EventStream<[A, B, C, D, E, F]>
    zipAsArray(...other: Array<AnyObs<any>>): EventStream<any[]>
  }
}

declare module "./Property" {
  interface Property<A> {
    map<B>(project: Projection<A, B>): Property<B>
    filter(predicate: Predicate<A>): Property<A>
    take(n: number): Property<A>
    first(): Property<A>
    flatMapLatest<B>(project: Projection<A, Observable<B>>): Property<B>
    sampleBy<B>(sampler: EventStream<B>): EventStream<A>
    sampleBy<B, C>(sampler: EventStream<B>, f: SampleFn<A, B, C>): EventStream<C>
    sampleBy<B>(sampler: Property<B>): Property<A>
    sampleBy<B, C>(sampler: Property<B>, f: SampleFn<A, B, C>): Property<C>
    zipAsArray<B>(s1: AnyObs<B>): EventStream<[A, B]>
    zipAsArray<B, C>(s1: AnyObs<B>, s2: AnyObs<C>): EventStream<[A, B, C]>
    zipAsArray<B, C, D>(s1: AnyObs<B>, s2: AnyObs<C>, s3: AnyObs<D>): EventStream<[A, B, C, D]>
    zipAsArray<B, C, D, E>(
      s1: AnyObs<B>,
      s2: AnyObs<C>,
      s3: AnyObs<D>,
      s4: AnyObs<E>,
    ): EventStream<[A, B, C, D, E]>
    zipAsArray<B, C, D, E, F>(
      s1: AnyObs<B>,
      s2: AnyObs<C>,
      s3: AnyObs<D>,
      s4: AnyObs<E>,
      s5: AnyObs<F>,
    ): EventStream<[A, B, C, D, E, F]>
    zipAsArray(...other: Array<AnyObs<any>>): EventStream<any[]>
    zipAsArray<B>(p1: Property<B>): Property<[A, B]>
    zipAsArray<B, C>(p1: Property<B>, p2: Property<C>): Property<[A, B, C]>
    zipAsArray<B, C, D>(p1: Property<B>, p2: Property<C>, p3: Property<D>): Property<[A, B, C, D]>
    zipAsArray<B, C, D, E>(
      p1: Property<B>,
      p2: Property<C>,
      p3: Property<D>,
      p4: Property<E>,
    ): Property<[A, B, C, D, E]>
    zipAsArray<B, C, D, E, F>(
      p1: Property<B>,
      p2: Property<C>,
      p3: Property<D>,
      p4: Property<E>,
      p5: Property<F>,
    ): Property<[A, B, C, D, E, F]>
    zipAsArray(...other: Array<Property<any>>): Property<any[]>
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

Observable.prototype.zipAsArray = ({
  zipAsArray(...other: Array<Observable<any>>): Observable<any[]> {
    return Zip._zip(identity, [this as any].concat(other))
  },
} as any).zipAsArray

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
export { combineAsArray } from "./operators/combine"
export { zipAsArray } from "./operators/zip"

// classes and interfaces

export * from "./Event"
export * from "./_interfaces"
export { Observable } from "./Observable"
export { EventStream } from "./EventStream"
export { AnyObs, Property } from "./Property"
