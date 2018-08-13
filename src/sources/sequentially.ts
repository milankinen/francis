import { checkArray, checkNaturalInt } from "../_check"
import { AnyEvent } from "../_interfaces"
import { makeEventStream } from "../_obs"
import { curry2 } from "../_util"
import { End, isEvent, Next } from "../Event"
import { EventStream } from "../EventStream"
import { identity } from "../operators/_base"
import { TimerBase } from "./_timer"

export interface SequentiallyOp {
  <T>(interval: number, events: Array<T | AnyEvent<T>>): EventStream<T>
  (interval: number): <T>(events: Array<T | AnyEvent<T>>) => EventStream<T>
}

export const sequentially: SequentiallyOp = curry2(_sequentially)

function _sequentially<T>(interval: number, events: Array<T | AnyEvent<T>>): EventStream<T> {
  checkNaturalInt(interval)
  checkArray(events)
  return makeEventStream(identity(new Sequentially(interval, events)))
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
