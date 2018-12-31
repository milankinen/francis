import { curry2 } from "../_util"
import { isError, isNext, noMore } from "../Event"
import { Observable } from "../Observable"
import { last } from "./last"
import { subscribe } from "./subscribe"

/**
 * Returns a Promise which will be resolved with the first event (or error) coming from
 * an Observable. Uses global ES6 promise implementation to construct the promise.
 *
 * @param obs Observable whose first event/error will be resolved to the promise
 *
 * @see firstToCustomPromise
 * @see toPromise
 * @see toCustomPromise
 *
 * @example
 *
 * F.firstToPromise(F.sequentially(100, [1, 2, 3])).then(console.log)
 * // => 1
 *
 * @public
 */
export function firstToPromise<ValueType>(obs: Observable<ValueType>): Promise<ValueType> {
  return _firstToPromise(undefined, obs)
}

/**
 * Works same as `firstToPromise` but offers way to use custom promise
 * implementation instead.
 *
 * @param ctor Constructor to the custom promise implementation
 * @param obs Observable whose first event/error will be resolved to the promise
 *
 * @see firstToPromise
 * @see toPromise
 * @see toCustomPromise
 *
 * @example
 *
 * import * as Promise from "bluebird"
 * const bluebirdPromise = F.firstToCustomPromise(Promise, F.later(100, "tsers!"))
 *
 * @public
 */
export const firstToCustomPromise: CurriedFirstToCustomPromise = curry2(_firstToCustomPromise)
interface CurriedFirstToCustomPromise {
  <ValueType>(ctor: PromiseConstructor, obs: Observable<ValueType>): Promise<ValueType>
  <ValueType>(ctor: PromiseConstructor): (obs: Observable<ValueType>) => Promise<ValueType>
}

function _firstToCustomPromise<ValueType>(
  ctor: PromiseConstructor,
  obs: Observable<ValueType>,
): Promise<ValueType> {
  return _firstToPromise(ctor, obs)
}

/**
 * Returns a Promise which will be resolved with the last event (or first error) coming from
 * an Observable. Uses global ES6 promise implementation to construct the promise.
 *
 * @param obs Observable whose last event/error will be resolved to the promise
 *
 * @see toCustomPromise
 * @see firstToPromise
 * @see firstToCustomPromise
 *
 * @example
 *
 * F.firstToPromise(F.sequentially(100, [1, 2, 3])).then(console.log)
 * // => 3
 *
 * @public
 */
export function toPromise<ValueType>(obs: Observable<ValueType>): Promise<ValueType> {
  return _firstToPromise(undefined, last(obs))
}

/**
 * Works same as `toPromise` but offers way to use custom promise implementation instead.
 *
 * @param ctor Constructor to the custom promise implementation
 * @param obs Observable whose last event/error will be resolved to the promise
 *
 * @see toPromise
 * @see firstToPromise
 * @see firstToCustomPromise
 *
 * @example
 *
 * import * as Promise from "bluebird"
 * const bluebirdPromise = F.toCustomPromise(Promise, F.later(100, "tsers!"))
 *
 * @public
 */
export const toCustomPromise: CurriedToCustomPromise = curry2(_toCustomPromise)
interface CurriedToCustomPromise {
  <ValueType>(ctor: PromiseConstructor, obs: Observable<ValueType>): Promise<ValueType>
  <ValueType>(ctor: PromiseConstructor): (obs: Observable<ValueType>) => Promise<ValueType>
}

function _toCustomPromise<ValueType>(
  ctor: PromiseConstructor,
  obs: Observable<ValueType>,
): Promise<ValueType> {
  return _firstToPromise(ctor, last(obs))
}

function _firstToPromise(ctor: PromiseConstructor | undefined, obs: Observable<any>): Promise<any> {
  ctor = ctor || nativeCtor()
  return new ctor<any>((resolve, reject) => {
    subscribe(event => {
      if (isNext(event)) {
        resolve(event.value)
      } else if (isError(event)) {
        reject(event.error)
      }
      return noMore
    }, obs)
  })
}

function nativeCtor(): PromiseConstructor {
  return Promise
}
