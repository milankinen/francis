import { Subscriber } from "../_core"
import { AnyEvent } from "../_interfaces"
import { OnTimeout, scheduleTimeout, Timeout } from "../scheduler/index"
import { Activation, Root } from "./_base"

export abstract class TimerBase<T> extends Root<T> {
  constructor(public readonly interval: number) {
    super(false)
  }

  public abstract tick(): Array<AnyEvent<T>>

  protected create(subscriber: Subscriber<T>): Activation<T, TimerBase<T>> {
    return new Tick(this, subscriber)
  }
}

class Tick<T> extends Activation<T, TimerBase<T>> implements OnTimeout {
  private timeout: Timeout | null = null
  constructor(owner: TimerBase<T>, subscriber: Subscriber<T>) {
    super(owner, subscriber)
  }

  public due(): void {
    const events = this.owner.tick()
    const n = events.length
    // perf optimization for common case n = 1
    if (n === 1) {
      this.send(events[0])
    } else {
      for (let i = 0; this.active && i < n; i++) {
        this.send(events[i])
      }
    }
    if (this.active) {
      this.timeout = scheduleTimeout(this, this.owner.interval)
    }
  }

  protected start(): void {
    this.timeout = scheduleTimeout(this, this.owner.interval)
  }

  protected stop(): void {
    if (this.timeout !== null) {
      this.timeout.cancel()
      this.timeout = null
    }
  }
}
