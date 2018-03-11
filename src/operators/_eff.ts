import { Subscriber, Subscription } from "../_core"
import { initPriority } from "../_priority"
import { Transaction } from "../_tx"
import { disableNoUnusedWarning } from "../_util"
import { Observable } from "../Observable"
import { currentScheduler } from "../scheduler/index"

export function runEffects<T>(runner: EffectRunner<T>, observable: Observable<T>): void {
  const scheduler = currentScheduler()
  const subs = observable.op.subscribe(scheduler, runner, initPriority(observable.op.weight, 0))
  const anyRunner = runner as any
  anyRunner.__init(subs)
  scheduler.run()
}

export class EffectRunner<T> implements Subscriber<T> {
  private __subs: Subscription | null = null

  constructor() {
    // tslint:disable-next-line:no-unused-expression
    false && disableNoUnusedWarning(this.__init)
  }

  public isActive(): boolean {
    return this.__subs !== null
  }

  public initial(tx: Transaction, val: T): void {}

  public noinitial(tx: Transaction): void {}

  public event(tx: Transaction, val: T): void {}

  public error(tx: Transaction, err: Error): void {}

  public end(tx: Transaction): void {
    this.dispose()
  }

  public dispose(): void {
    const subscription = this.__subs
    if (subscription !== null) {
      this.__subs = null
      subscription.dispose()
    }
  }

  private __init(subscription: Subscription): void {
    this.__subs = subscription
  }
}
