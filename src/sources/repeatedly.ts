import { AnyEvent } from "../_interfaces"
import { makeEventStream } from "../_obs"
import { isEvent, Next } from "../Event"
import { EventStream } from "../EventStream"
import { identity } from "../operators/_base"
import { Sequentially } from "./sequentially"

export function repeatedly<T>(interval: number, events: Array<T | AnyEvent<T>>): EventStream<T> {
  return makeEventStream(identity(new Repeatedly(interval, events)))
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
