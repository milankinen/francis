import { makeEventStream } from "../_obs"
import { AnyEvent } from "../bacon"
import { Next } from "../Event"
import { EventStream } from "../EventStream"
import { identity } from "../operators/_base"
import { TimerBase } from "./_timer"

export function interval<T>(period: number, value: T): EventStream<any> {
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
