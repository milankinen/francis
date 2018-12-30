import { checkNaturalInt } from "../_check"
import { AnyEvent } from "../_interfaces"
import { makeEventStream } from "../_obs"
import { curry2 } from "../_util"
import { Next } from "../Event"
import { EventStream } from "../EventStream"
import { TimerBase } from "./_timer"

/**
 * Repeats the single element indefinitely with the given interval
 *
 * @param period - Inverval in milliseconds
 * @param value - Repeated value
 *
 * @example
 *
 * const messages = F.inverval(1000, "Tsers!")
 *
 * @public
 */
export const interval: CurriedInterval = curry2(_interval)
interface CurriedInterval {
  <ValueType>(period: number, value: ValueType): EventStream<ValueType>
  (period: number): <ValueType>(value: ValueType) => EventStream<ValueType>
}

function _interval<T>(period: number, value: T): EventStream<T> {
  checkNaturalInt(period)
  return makeEventStream(new Interval(period, [new Next(value)]))
}

class Interval<T> extends TimerBase<T> {
  constructor(period: number, private v: Array<Next<T>>) {
    super(period)
  }

  public tick(): Array<AnyEvent<T>> {
    return this.v
  }
}
