import { __DEVELOPER__ } from "../_assert"
import { Subscriber, Subscription } from "../_core"
import { Transaction } from "../_tx"
import { disableNoUnusedWarning } from "../_util"
import { Observable } from "../Observable"
import { getOuterScheduler } from "../scheduler/index"

export function runEffects<T>(runner: EffectRunner<T>, observable: Observable<T>): void {
  const scheduler = getOuterScheduler()
  const subs = observable.src.subscribe(scheduler, runner, 0)
  const anyRunner = runner as any
  /*if (__DEVELOPER__) {
    const initial = anyRunner.initial
    const noinitial = anyRunner.noinitial
    const next = anyRunner.next
    anyRunner.initial = (tx: any, val: any) => {
      anyRunner.__syncReceived = true
      initial.call(anyRunner, tx, val)
    }
    anyRunner.noinitial = (tx: any) => {
      anyRunner.__syncReceived = true
      noinitial.call(anyRunner, tx)
    }
    anyRunner.next = (tx: any, val: any) => {
      anyRunner.__syncReceived = true
      next.call(anyRunner, tx, val)
    }
  }*/
  anyRunner.__init(subs)
  scheduler.run()
  if (__DEVELOPER__) {
    /*if (observable.op && anyRunner.__syncReceived === false) {
      logAndThrow("**BUG** Missing initial/noinitial event")
    }*/
  }
}

export class EffectRunner<T> implements Subscriber<T> {
  private __subs: Subscription | null = null

  constructor() {
    false && disableNoUnusedWarning(this.__init)
    // prettier-ignore
    if (__DEVELOPER__) {
      (this as any).__syncReceived = false
    }
  }

  public begin(): boolean {
    // we've reached to the effect handler so we can now signal the source
    // that it's ok to begin event emission
    return true
  }

  public next(tx: Transaction, val: T): void {}

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
