import { sendRootEnd, sendRootEvent, Source, Subscriber, Subscription } from "../_core"
import { EventStream } from "../EventStream"
import { identity } from "../operators/_base"
import { Scheduler, Task } from "../scheduler/index"

export function once<T>(value: T): EventStream<T> {
  return new EventStream(identity(new Once(value)))
}

class Once<T> implements Source<T> {
  public weight: number = 1
  public val: T
  public sent: boolean

  constructor(value: T) {
    this.sent = false
    this.val = value
  }

  public subscribe(scheduler: Scheduler, subscriber: Subscriber<T>, weight: number): Subscription {
    const task = new ActivateOnceTask(this, subscriber)
    scheduler.scheduleEventStreamActivation(task)
    return task
  }
}

class ActivateOnceTask<T> implements Task, Subscription {
  private active: boolean = true
  constructor(private state: Once<T>, private subscriber: Subscriber<T>) {}

  public run(): void {
    if (this.active && !this.state.sent) {
      this.state.sent = true
      sendRootEvent(this.subscriber, this.state.val)
    }
    // tslint:disable-next-line:no-unused-expression
    this.active && sendRootEnd(this.subscriber)
  }

  public dispose(): void {
    this.active = false
  }

  public reorder(order: number): void {
    /* no-op */
  }
}
