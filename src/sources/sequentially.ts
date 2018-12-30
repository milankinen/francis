import { checkArray, checkNaturalInt } from "../_check"
import { AnyEvent } from "../_interfaces"
import { makeEventStream } from "../_obs"
import { curry2 } from "../_util"
import { End, isEvent, Next } from "../Event"
import { EventStream } from "../EventStream"
import { TimerBase } from "./_timer"

/**
 * Creates an EventStream containing the given values emitted
 * with the given interval.
 *
 * @param interval - Interval in milliseconds
 * @param events - Events to emit
 * @returns Some shit
 *
 * @example
 *
 * const numEvery100ms = F.sequentially(100, [1, 2, 3])
 *
 * @public
 */
export const sequentially: CurriedSequentially = curry2(_sequentially)
interface CurriedSequentially {
  <ValueType>(interval: number, events: Array<ValueType | AnyEvent<ValueType>>): EventStream<
    ValueType
  >
  (interval: number): <ValueType>(
    events: Array<ValueType | AnyEvent<ValueType>>,
  ) => EventStream<ValueType>
}

function _sequentially<T>(interval: number, events: Array<T | AnyEvent<T>>): EventStream<T> {
  checkNaturalInt(interval)
  checkArray(events)
  return makeEventStream(new Sequentially(interval, events))
}

export class Sequentially<T> extends TimerBase<T> {
  protected i: number
  constructor(interval: number, protected readonly items: Array<T | AnyEvent<T>>) {
    super(interval)
    this.i = 0
  }

  public tick(): Array<AnyEvent<T>> {
    switch (this.items.length - this.i) {
      case 0:
        return [new End()]
      case 1: {
        const it = this.items[this.i++]
        if (isEvent(it)) {
          return it.isEnd ? [it] : [it, new End()]
        } else {
          return [new Next(it), new End()]
        }
      }
      default: {
        const it = this.items[this.i++]
        return [isEvent(it) ? it : new Next(it)]
      }
    }
  }
}
