import { curry2, pipe } from "../_util"
import { Observable } from "../Observable"
import { Property } from "../Property"
import { combineWith } from "./combine"
import { doAction } from "./do"
import { map } from "./map"
import { skipDuplicates } from "./skipDuplicates"
import { toPropertyWith } from "./toProperty"

/**
 * Creates a Property that indicates whether observable is awaiting the other observable,
 * i.e. has produced a value after the latest value from the other. This is handy for
 * keeping track whether we are currently awaiting an AJAX response
 *
 * @param toWait Observable whose value is waited after each event of `obs`
 * @param obs Observable who is waiting `toWait`
 *
 * @example
 *
 * const searchReq = F.map(toRequest, searchTextChange)
 * const searchRes = F.flatMapLatest(sendRequest, searchReq)
 * const isRequestPending = F.awaiting(searchRes, searchReq)
 *
 * @public
 */
export const awaiting: CurriedAwaiting = curry2(_awaiting)
interface CurriedAwaiting {
  (toWait: Observable<any>, obs: Observable<any>): Property<boolean>
  (toWait: Observable<any>): (obs: Observable<any>) => Property<boolean>
}

function _awaiting(toWait: Observable<any>, obs: Observable<any>): Property<boolean> {
  let counter = 0
  const waiting = pipe(
    obs,
    map(_ => counter),
    toPropertyWith(counter),
  )
  const waited = pipe(
    toWait,
    map(_ => counter),
    toPropertyWith(counter),
  )
  return pipe(
    combineWith(isWaiting, [waited, waiting]),
    doAction(_ => ++counter),
    skipDuplicates(identical),
  ) as Property<boolean>
}

function isWaiting(waited: number, waiting: number): boolean {
  return waited < waiting
}

function identical(a: any, b: any): boolean {
  return a === b
}
