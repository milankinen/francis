import { AnyEvent } from "../bacon"
import { isEvent, Next } from "../Event"
import { EventStream } from "../EventStream"
import { identity } from "../operators/_base"
import { TimerBase } from "./_timer"

export function fromPoll<T>(interval: number, f: () => T | AnyEvent<T>): EventStream<any> {
  return new EventStream(identity(new FromPoll(interval, f)))
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
