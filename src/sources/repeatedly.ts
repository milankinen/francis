import { checkArray, checkNaturalInt } from "../_check"
import { AnyEvent } from "../_interfaces"
import { makeEventStream } from "../_obs"
import { curry2 } from "../_util"
import { isEvent, Next } from "../Event"
import { EventStream } from "../EventStream"
import { Sequentially } from "./sequentially"

/**
 * Repeats given elements indefinitely with the given interval.
 *
 * @param interval - Interval in milliseconds
 * @param events - Event sequence to repeat indefinitely
 *
 * @example
 *
 * const lolbal = F.repeatedly(10, ["lol", "bal"])
 *
 * @public
 */
export const repeatedly: CurriedRepeatedly = curry2(_repeatedly)
interface CurriedRepeatedly {
  <ValueType>(interval: number, events: Array<ValueType | AnyEvent<ValueType>>): EventStream<
    ValueType
  >
  (interval: number): <ValueType>(
    events: Array<ValueType | AnyEvent<ValueType>>,
  ) => EventStream<ValueType>
}

function _repeatedly<T>(interval: number, events: Array<T | AnyEvent<T>>): EventStream<T> {
  checkNaturalInt(interval)
  checkArray(events)
  return makeEventStream(new Repeatedly(interval, events))
}

class Repeatedly<T> extends Sequentially<T> {
  public tick(): Array<AnyEvent<T>> {
    if (this.items.length - this.i === 1) {
      const it = this.items[this.i]
      this.i = 0
      return [isEvent(it) ? it : new Next(it)]
    } else {
      return super.tick()
    }
  }
}
