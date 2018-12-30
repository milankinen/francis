import { checkFunction, checkNaturalInt } from "../_check"
import { AnyEvent } from "../_interfaces"
import { makeEventStream } from "../_obs"
import { curry2 } from "../_util"
import { isEvent, Next } from "../Event"
import { EventStream } from "../EventStream"
import { TimerBase } from "./_timer"

/**
 * Polls given function with given interval. Function should return plain values
 * or `F.Event` objects. Polling occurs only when there are subscribers to the stream.
 * Polling ends permanently when `f` returns `F.End`.
 *
 * @param interval - Polling interval in milliseconds
 * @param f - Function that will be called on each tick
 *
 * @example
 *
 * const nowEverySec = F.fromPoll(1000, () => Date.now())
 *
 * @public
 */
export const fromPoll: CurriedFromPoll = curry2(_fromPoll)
interface CurriedFromPoll {
  <ValueType>(interval: number, f: () => ValueType | AnyEvent<ValueType>): EventStream<ValueType>
  (interval: number): <T>(f: () => T | AnyEvent<T>) => EventStream<T>
}

function _fromPoll<T>(interval: number, f: () => T | AnyEvent<T>): EventStream<T> {
  checkNaturalInt(interval)
  checkFunction(f)
  return makeEventStream(new FromPoll(interval, f))
}

class FromPoll<T> extends TimerBase<T> {
  constructor(interval: number, private f: () => T | AnyEvent<T>) {
    super(interval)
  }

  public tick(): Array<AnyEvent<T>> {
    const f = this.f
    const next = f()
    return [isEvent(next) ? next : new Next(next)]
  }
}
