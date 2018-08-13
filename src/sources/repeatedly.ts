import { checkArray, checkNaturalInt } from "../_check"
import { AnyEvent } from "../_interfaces"
import { makeEventStream } from "../_obs"
import { curry2 } from "../_util"
import { isEvent, Next } from "../Event"
import { EventStream } from "../EventStream"
import { Sequentially } from "./sequentially"

export interface RepeatedlyOp {
  <T>(interval: number, events: Array<T | AnyEvent<T>>): EventStream<T>
  (interval: number): <T>(events: Array<T | AnyEvent<T>>) => EventStream<T>
}

export const repeatedly: RepeatedlyOp = curry2(_repeatedly)

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
