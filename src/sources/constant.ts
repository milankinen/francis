import { sendRootEnd, sendRootInitial, Source, Subscriber, Subscription } from "../_core"
import { identity } from "../operators/_base"
import { Property } from "../Property"
import { Scheduler, Task } from "../scheduler/index"

export function constant<T>(val: T): Property<T> {
  return new Property(identity(new Constant(val)))
}

class Constant<T> implements Source<T> {
  public weight: number = 1

  constructor(private _v: T) {}

  public subscribe(scheduler: Scheduler, subscriber: Subscriber<T>, weight: number): Subscription {
    const task = new ActivateConstantTask(this._v, subscriber)
    scheduler.schedulePropertyActivation(task)
    return task
  }
}

class ActivateConstantTask<T> implements Task, Subscription {
  private act: boolean = true
  constructor(private val: T, private subscriber: Subscriber<T>) {}

  public run(): void {
    // tslint:disable-next-line:no-unused-expression
    this.act && sendRootInitial(this.subscriber, this.val)
    // tslint:disable-next-line:no-unused-expression
    this.act && sendRootEnd(this.subscriber)
  }

  public cancel(): void {
    this.act = false
  }

  public dispose(): void {
    this.cancel()
  }

  public reorder(order: number): void {
    /* no-op */
  }
}
