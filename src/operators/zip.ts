import { checkArray, checkFunction } from "../_check"
import { slice } from "../_util"
import { EventStream } from "../EventStream"
import { Observable } from "../Observable"
import { never } from "../sources/never"
import { map } from "./map"
import { toEventStream } from "./toEventStream"
import { _when } from "./when"

export function zipAsArray<A>(streams: [Observable<A>]): EventStream<[A]>
export function zipAsArray<A, B>(streams: [Observable<A>, Observable<B>]): EventStream<[A, B]>
export function zipAsArray<A, B, C>(
  streams: [Observable<A>, Observable<B>, Observable<C>],
): EventStream<[A, B, C]>
export function zipAsArray<A, B, C, D>(
  streams: [Observable<A>, Observable<B>, Observable<C>, Observable<D>],
): EventStream<[A, B, C, D]>
export function zipAsArray<A, B, C, D, E>(
  streams: [Observable<A>, Observable<B>, Observable<C>, Observable<D>, Observable<E>],
): EventStream<[A, B, C, D, E]>
export function zipAsArray<A, B, C, D, E, F>(
  streams: [
    Observable<A>,
    Observable<B>,
    Observable<C>,
    Observable<D>,
    Observable<E>,
    Observable<F>
  ],
): EventStream<[A, B, C, D, E, F]>
export function zipAsArray(streams: Array<Observable<any>>): EventStream<any[]> {
  checkArray(streams)
  switch (streams.length) {
    case 0:
      return never<any>()
    case 1:
      return map(x => [x], toEventStream(streams[0])) as EventStream<[any]>
    default:
      return _when([streams.map(toEventStream), slice], false)
  }
}

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
export function zipWith<T>(
  f: (...args: any[]) => T,
  streams: Array<Observable<any>>,
): EventStream<T> {
  checkArray(streams)
  checkFunction(f)
  switch (streams.length) {
    case 0:
      return never<any>()
    case 1:
      return map(f, toEventStream(streams[0])) as EventStream<any>
    default:
      return _when([streams.map(toEventStream), f], true)
  }
}
