import { checkObservable } from "../_check"
import { NOOP_SUBSCRIPTION, Subscriber, Subscription } from "../_core"
import { Transaction } from "../_tx"
import { dispatcherOf, Observable } from "../Observable"
import { handleActivations } from "../scheduler/index"

export function runEffects<T>(eff: Eff<T>, observable: Observable<T>): void {
  checkObservable(observable)
  const subs = dispatcherOf(observable).subscribe(eff, 0)
  const initialNeeded = true
  eff.setSubscription(subs)
  subs.activate(initialNeeded)
  handleActivations()
}

export class Eff<T> implements Subscriber<T> {
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
