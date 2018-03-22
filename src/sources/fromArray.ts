import { sendRootEnd, sendRootEvent, Source, Subscriber, Subscription } from "../_core"
import { EventStream } from "../EventStream"
import { identity } from "../operators/_base"
import { Scheduler, Task } from "../scheduler/index"

export function fromArray<T>(events: T[]): EventStream<T> {
  return new EventStream(identity(new FromArray(events)))
}

class FromArray<T> implements Source<T> {
  public weight: number = 1
  public i: number

  constructor(public items: T[]) {
    this.i = 0
  }

  public subscribe(scheduler: Scheduler, subscriber: Subscriber<T>, weight: number): Subscription {
    const task = new ActivateFromArrayTask(this, subscriber)
    scheduler.scheduleEventStreamActivation(task)
    return task
  }
}

class ActivateFromArrayTask<T> implements Task, Subscription {
  private active: boolean = true
  constructor(private state: FromArray<T>, private subscriber: Subscriber<T>) {}

  public run(): void {
    const subscriber = this.subscriber
    const state = this.state
    const items = this.state.items
    const n = items.length
    for (; this.active && state.i < n; ++state.i) {
      sendRootEvent(subscriber, items[state.i])
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
