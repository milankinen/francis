import { makeEventStream } from "../_obs"
import { curry2 } from "../_util"
import { AnyEvent } from "../bacon"
import { isEvent, Next } from "../Event"
import { EventStream } from "../EventStream"
import { identity } from "../operators/_base"
import { TimerBase } from "./_timer"

export interface FromPollOp {
  <T>(interval: number, f: () => T | AnyEvent<T>): EventStream<T>
  (interval: number): <T>(f: () => T | AnyEvent<T>) => EventStream<T>
}

export const fromPoll: FromPollOp = curry2(_fromPoll)

function _fromPoll<T>(interval: number, f: () => T | AnyEvent<T>): EventStream<T> {
  return makeEventStream(identity(new FromPoll(interval, f)))
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
