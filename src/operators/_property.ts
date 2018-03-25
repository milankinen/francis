import { NONE, sendRootEnd, sendRootInitial, sendRootNoInitial, Subscriber } from "../_core"
import { Transaction } from "../_tx"
import { Scheduler } from "../scheduler/index"
import { Task } from "../scheduler/Scheduler"
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
    this.handleReplayState(subsciber)
  }

  public handleReplayState(subsciber: Subscriber<T>): void {
    subsciber.isActive() &&
      (this.val === NONE ? sendRootNoInitial(subsciber) : sendRootInitial(subsciber, this.val))
    this.ended && subsciber.isActive() && sendRootEnd(subsciber)
  }
}

class ReplayStateTask<T> implements Task {
  constructor(private pmc: PropertyMulticast<T>, private dest: Subscriber<T>) {}
  public run(): void {
    this.pmc.handleReplayState(this.dest)
  }
}
