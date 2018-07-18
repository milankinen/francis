import { NOOP_SUBSCRIPTION, Subscriber, Subscription } from "../_core"
import { Transaction } from "../_tx"
import { Observable } from "../Observable"
import { handleActivations } from "../scheduler/index"

export function runEffects<T>(runner: EffectRunner<T>, observable: Observable<T>): void {
  const subs = observable.src.subscribe(runner, 0)
  const initialNeeded = true
  runner.setSubscription(subs)
  subs.activate(initialNeeded)
  handleActivations()
}

export class EffectRunner<T> implements Subscriber<T> {
  private subs: Subscription = NOOP_SUBSCRIPTION

  public setSubscription(subscription: Subscription): void {
    this.subs = subscription
  }

  public dispose(): void {
    const { subs } = this
    this.subs = NOOP_SUBSCRIPTION
    subs.dispose()
  }

  public next(tx: Transaction, val: T): void {}

  public error(tx: Transaction, err: Error): void {}

  public end(tx: Transaction): void {
    this.dispose()
  }
}
