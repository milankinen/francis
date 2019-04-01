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

export function zipWith<A, ResultType>(
  f: (a: A) => ResultType,
  streams: [Observable<A>],
): EventStream<ResultType>
export function zipWith<A, B, ResultType>(
  f: (a: A, b: B) => ResultType,
  streams: [Observable<A>, Observable<B>],
): EventStream<ResultType>
export function zipWith<A, B, C, ResultType>(
  f: (a: A, b: B, c: C) => ResultType,
  streams: [Observable<A>, Observable<B>, Observable<C>],
): EventStream<ResultType>
export function zipWith<A, B, C, D, ResultType>(
  f: (a: A, b: B, c: C, d: D) => ResultType,
  streams: [Observable<A>, Observable<B>, Observable<C>, Observable<D>],
): EventStream<ResultType>
export function zipWith<A, B, C, D, E, ResultType>(
  f: (a: A, b: B, c: C, d: D, e: E) => ResultType,
  streams: [Observable<A>, Observable<B>, Observable<C>, Observable<D>, Observable<E>],
): EventStream<ResultType>
export function zipWith<A, B, C, D, E, F, ResultType>(
  f: (a: A, b: B, c: C, d: D, e: E, f: F) => ResultType,
  streams: [
    Observable<A>,
    Observable<B>,
    Observable<C>,
    Observable<D>,
    Observable<E>,
    Observable<F>
  ],
): EventStream<ResultType>
export function zipWith<ResultType>(
  f: (...args: any[]) => ResultType,
  streams: Array<Observable<any>>,
): EventStream<ResultType> {
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
