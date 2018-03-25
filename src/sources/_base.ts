import { Source, Subscriber, Subscription } from "../_core"
import { Scheduler, Task } from "../scheduler/index"

export abstract class Root<T> implements Source<T> {
  public weight: number = 1

  public subscribe(scheduler: Scheduler, subscriber: Subscriber<T>, order: number): Subscription {
    return this.activate(scheduler, subscriber)
  }

  protected abstract activate(scheduler: Scheduler, subscriber: Subscriber<T>): Activation
}

export abstract class Activation implements Task, Subscription {
  protected readonly active: boolean = true

  public run(): void {
    this.start()
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

  protected stop(): void {}
}
