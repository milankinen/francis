import { NONE, sendRootEnd, sendRootInitial, sendRootNoInitial, Subscriber } from "../_core"
import { Transaction } from "../_tx"
import { Scheduler } from "../scheduler/index"
import { AbortSubscriptionListener, AbortSubscriptionTask, MulticastImplementation } from "./_base"

export class PropertyMulticast<T> extends MulticastImplementation<T>
  implements AbortSubscriptionListener<T> {
  private val: T = NONE
  private ended: boolean = false

  public beforeActivation(scheduler: Scheduler, subscriber: Subscriber<T>): boolean {
    if (this.ended) {
      scheduler.scheduleAbortSubscription(new AbortSubscriptionTask(this, subscriber))
      return false
    } else {
      return true
    }
  }

  public beforeMulticast(scheduler: Scheduler, subscriber: Subscriber<T>): boolean {
    if (!this.beforeActivation(scheduler, subscriber)) {
      return false
    }
    scheduler.schedulePropertyActivation(new ReplayStateTask(this, subscriber))
    return true
  }

  public initial(tx: Transaction, val: T): void {
    this.next.initial(tx, (this.val = val))
  }

  public noinitial(tx: Transaction): void {
    const currentValue = this.val
    currentValue === NONE ? this.next.noinitial(tx) : this.next.initial(tx, currentValue)
  }

  public event(tx: Transaction, val: T): void {
    this.next.event(tx, (this.val = val))
  }

  public end(tx: Transaction): void {
    this.ended = true
    this.next.end(tx)
  }

  public handleAbort(subsciber: Subscriber<T>): void {
    this.__replayState(subsciber)
  }

  private __replayState(dest: Subscriber<T>): void {
    // tslint:disable-next-line:no-unused-expression
    dest.isActive() &&
      (this.val === NONE ? sendRootNoInitial(dest) : sendRootInitial(dest, this.val))
    // tslint:disable-next-line:no-unused-expression
    this.ended && dest.isActive() && sendRootEnd(dest)
  }
}

class ReplayStateTask<T> extends AbortSubscriptionTask<T> {}
