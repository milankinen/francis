import { __DEVELOPER__, logAndThrow } from "../_assert"
import {
  NOOP_SUBSCRIBER,
  sendEndInTx,
  sendErrorInTx,
  sendNextInTx,
  Source,
  Subscriber,
  Subscription,
} from "../_core"
import { AnyEvent } from "../_interfaces"
import { isEnd, isError, isEvent, isNext } from "../Event"
import { scheduleActivationTask, Task } from "../scheduler/index"

export abstract class Root<T> implements Source<T> {
  public readonly weight: number = 1
  constructor(public readonly sync: boolean) {}

  public subscribe(subscriber: Subscriber<T>, order: number): Subscription {
    return this.create(subscriber)
  }

  protected abstract create(subscriber: Subscriber<T>): Activation<T, any>
}

export abstract class Activation<T, R extends Root<T>> implements Task, Subscription {
  protected readonly owner: R
  protected active: boolean = true
  protected subscriber: Subscriber<T>

  constructor(owner: R, subscriber: Subscriber<T>) {
    this.subscriber = subscriber
    this.owner = owner
  }

  public run(): void {
    if (this.active) {
      this.start()
    }
  }

  public activate(initialNeeded: boolean): void {
    if (this.owner.sync) {
      this.run()
    } else {
      scheduleActivationTask(this)
    }
  }

  public dispose(): void {
    this.active = false
    this.subscriber = NOOP_SUBSCRIBER
    this.stop()
  }

  public reorder(order: number): void {
    // no-op
  }

  public send(event: T | AnyEvent<T>): void {
    if (isEvent(event)) {
      if (isNext(event)) {
        this.sendNext(event.value)
      } else if (isError(event)) {
        this.sendError(event.error)
      } else if (isEnd(event)) {
        this.sendEnd()
      } else {
        if (__DEVELOPER__) {
          logAndThrow("**BUG** event type not known: " + event)
        }
      }
    } else {
      sendNextInTx(this.subscriber, event)
    }
  }

  protected abstract start(): void

  protected abstract stop(): void

  protected sendNext(val: T): void {
    sendNextInTx(this.subscriber, val)
  }

  protected sendError(err: Error): void {
    sendErrorInTx(this.subscriber, err)
  }

  protected sendEnd(): void {
    sendEndInTx(this.subscriber)
  }
}
