import { sendRootEnd, sendRootError, sendRootEvent, Subscriber } from "../_core"
import { AnyEvent } from "../_interfaces"
import { End, isEnd, isError, isNext } from "../Event"
import { OnTimeout, Scheduler, Timeout } from "../scheduler/index"
import { Activation, Root } from "./_base"

export abstract class TimerBase<T> extends Root<T> {
  private __ended: boolean = false
  constructor(public readonly interval: number) {
    super()
  }

  public abstract tick(): Array<AnyEvent<T>>

  public isEnded(): boolean {
    return this.__ended
  }

  public markEnded(): void {
    this.__ended = true
  }

  protected activate(scheduler: Scheduler, subscriber: Subscriber<T>): Activation {
    return new Tick(this, scheduler, subscriber)
  }
}

class Tick<T> extends Activation implements OnTimeout {
  private timeout: Timeout | null = null
  constructor(
    private t: TimerBase<T>,
    private scheduler: Scheduler,
    private subscriber: Subscriber<T>,
  ) {
    super()
  }

  public due(): void {
    const events = this.t.tick()
    const n = events.length
    if (n === 1) {
      this.handleEvent(events[0])
    } else {
      for (let i = 0; this.active && i < n; i++) {
        this.handleEvent(events[i])
      }
    }
    // tslint:disable-next-line:no-unused-expression
    this.active && (this.timeout = this.scheduler.scheduleTimeout(this, this.t.interval))
  }

  protected start(): void {
    if (this.active) {
      if (this.t.isEnded()) {
        this.handleEvent(new End())
      } else {
        this.timeout = this.scheduler.scheduleTimeout(this, this.t.interval)
      }
    }
  }

  protected stop(): void {
    if (this.timeout !== null) {
      this.timeout.cancel()
      this.timeout = null
    }
  }

  private handleEvent(event: AnyEvent<T>): void {
    if (isNext(event)) {
      sendRootEvent(this.subscriber, event.value)
    } else if (isError(event)) {
      this.t.markEnded()
      sendRootError(this.subscriber, event.error)
    } else if (isEnd(event)) {
      sendRootEnd(this.subscriber)
    } else {
      // TODO: throw error
    }
  }
}
