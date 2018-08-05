import { makeEventStream } from "../_obs"
import { curry2 } from "../_util"
import { AnyEvent } from "../bacon"
import { Next } from "../Event"
import { EventStream } from "../EventStream"
import { identity } from "../operators/_base"
import { TimerBase } from "./_timer"

export interface IntervalOp {
  <T>(period: number, value: T): EventStream<T>
  (period: number): <T>(value: T) => EventStream<T>
}

export const interval: IntervalOp = curry2(_interval)

function _interval<T>(period: number, value: T): EventStream<T> {
  return makeEventStream(identity(new Interval(period, [new Next(value)])))
}

class Interval<T> extends TimerBase<T> {
  constructor(period: number, private v: Array<Next<T>>) {
    super(period)
  }

  public tick(): Array<AnyEvent<T>> {
    return this.v
  }
}
