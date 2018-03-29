import { __DEVELOPER__, logAndThrow, __DEVBUILD__, assert } from "../_assert"
import {
  sendRootEnd,
  sendRootError,
  sendRootEvent,
  Source,
  Subscriber,
  Subscription,
} from "../_core"
import { AnyEvent } from "../_interfaces"
import { isEnd, isError, isEvent, isNext, isInitial } from "../Event"
import { Scheduler, Task } from "../scheduler/index"

export abstract class Root<T> implements Source<T> {
  public readonly weight: number = 1
  private __ended: boolean = false
  constructor(public readonly sync: boolean) {}

  public subscribe(scheduler: Scheduler, subscriber: Subscriber<T>, order: number): Subscription {
    const activation = this.activate(scheduler, subscriber)
    this.sync
      ? scheduler.schedulePropertyActivation(activation)
      : scheduler.scheduleEventStreamActivation(activation)
    return activation
  }

  public markEnded(): void {
    this.__ended = true
  }

  public isEnded(): boolean {
    return this.__ended
  }

  protected abstract activate(scheduler: Scheduler, subscriber: Subscriber<T>): Activation<T, any>
}

export abstract class Activation<T, R extends Root<T>> implements Task, Subscription {
  protected readonly owner: R
  protected readonly active: boolean = true
  protected readonly subscriber: Subscriber<T>
  protected readonly ended: boolean = false

  constructor(owner: R, subscriber: Subscriber<T>) {
    this.subscriber = subscriber
    this.owner = owner
  }

  public run(): void {
    if (this.active) {
      if (this.owner.isEnded()) {
        sendRootEnd(this.subscriber)
      } else {
        this.start()
      }
    }
  }

  public dispose(): void {
    // tslint:disable-next-line:semicolon whitespace
    ;(this.active as boolean) = false
    // tslint:disable-next-line:align
    this.stop()
  }

  public reorder(order: number): void {
    /* no-op */
  }

  protected abstract start(): void

  protected abstract stop(): void

  protected send(event: T | AnyEvent<T>): void {
    if (isEvent(event)) {
      if (isNext(event)) {
        this.sendNext(event.value)
      } else if (isError(event)) {
        this.sendError(event.error)
      } else if (isEnd(event)) {
        this.sendEnd()
      } else {
        if (__DEVBUILD__) {
          assert(!isInitial(event), "Manual initial event sending is not supported")
        }
        if (__DEVELOPER__) {
          logAndThrow("**BUG** event type not known: " + event)
        }
      }
    } else {
      sendRootEvent(this.subscriber, event)
    }
  }

  protected sendNext(val: T): void {
    sendRootEvent(this.subscriber, val)
  }

  protected sendError(err: Error): void {
    sendRootError(this.subscriber, err)
  }

  protected sendEnd(): void {
    this.owner.markEnded()
    sendRootEnd(this.subscriber)
  }
}
