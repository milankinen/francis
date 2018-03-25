import { AnyEvent } from "../bacon"
import { EventStream } from "../EventStream"
import { identity } from "../operators/_base"
import { TimerBase } from "./_timer"

export function fromPoll<T>(interval: number, f: () => AnyEvent<T>): EventStream<any> {
  return new EventStream(identity(new FromPoll(interval, f)))
}

class FromPoll<T> extends TimerBase<T> {
  constructor(interval: number, private f: () => AnyEvent<T>) {
    super(interval)
  }

  public tick(): Array<AnyEvent<T>> {
    const f = this.f
    return [f()]
  }
}
