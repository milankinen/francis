import { AnyEvent } from "../_interfaces"
import { End, Next } from "../Event"
import { EventStream } from "../EventStream"
import { identity } from "../operators/_base"
import { TimerBase } from "./_timer"

export function sequentially<T>(interval: number, events: T[]): EventStream<T>
export function sequentially<A, B>(interval: number, events: [A, B]): EventStream<A | B>
export function sequentially<A, B, C>(interval: number, events: [A, B, C]): EventStream<A | B | C>
export function sequentially<A, B, C, D>(
  interval: number,
  events: [A, B, C, D],
): EventStream<A | B | C | D>
export function sequentially<A, B, C, D, E>(
  interval: number,
  events: [A, B, C, D, E],
): EventStream<A | B | C | D | E>
export function sequentially<A, B, C, D, E, F>(
  interval: number,
  events: [A, B, C, D, E, F],
): EventStream<A | B | C | D | E | F>
export function sequentially(interval: number, events: any[]): EventStream<any> {
  return _sequentially(interval, events)
}

export function _sequentially(interval: number, events: any[]): EventStream<any> {
  return new EventStream(identity(new Sequentially(interval, events)))
}

class Sequentially extends TimerBase<any> {
  private i: number
  constructor(interval: number, private items: any[]) {
    super(interval)
    this.i = 0
  }

  public tick(): Array<AnyEvent<any>> {
    switch (this.items.length - this.i) {
      case 0:
        return [new End()]
      case 1:
        return [new Next(this.items[this.i++]), new End()]
      default:
        return [new Next(this.items[this.i++])]
    }
  }
}
