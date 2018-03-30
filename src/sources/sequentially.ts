import { AnyEvent } from "../_interfaces"
import { makeEventStream } from "../_obs"
import { End, isEvent, Next } from "../Event"
import { EventStream } from "../EventStream"
import { identity } from "../operators/_base"
import { TimerBase } from "./_timer"

export function sequentially<T>(interval: number, events: Array<T | AnyEvent<T>>): EventStream<T> {
  return makeEventStream(identity(new Sequentially(interval, events)))
}

class Sequentially<T> extends TimerBase<T> {
  private i: number
  constructor(interval: number, private items: Array<T | AnyEvent<T>>) {
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
