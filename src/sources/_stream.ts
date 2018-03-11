import { Source, Subscriber, Subscription } from "../_core"
import { EventStream } from "../EventStream"
import { identity } from "../operators/_base"
import { Scheduler, Task } from "../scheduler/index"

export interface ActivationState {
  running: boolean
}

export interface Activation<T> {
  run(subscriber: Subscriber<T>, state: ActivationState): void
}

export function root<T>(activation: Activation<T>): EventStream<T> {
  return new EventStream(identity(new EventStreamRoot(activation)))
}

export class EventStreamRoot<T> implements Source<T> {
  public weight: number = 1

  constructor(private _a: Activation<T>) {}

  public subscribe(scheduler: Scheduler, subscriber: Subscriber<T>, weight: number): Subscription {
    const task = new ActivateEventStreamTask(this._a, subscriber)
    scheduler.scheduleEventStreamActivation(task)
    return task
  }
}

class ActivateEventStreamTask<T> implements Task, Subscription {
  private _state: ActivationState = { running: true }

  constructor(private _a: Activation<T>, private _s: Subscriber<T>) {}

  public run(): void {
    const s = this._state
    if (s.running === true) {
      this._a.run(this._s, s)
    }
  }

  public cancel(): void {
    this._state.running = false
  }

  public dispose(): void {
    this._state.running = false
  }

  public reorder(order: number): void {
    /* no-op */
  }
}
