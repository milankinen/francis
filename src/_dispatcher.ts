import { __DEVELOPER__, logAndThrow } from "./_assert"
import {
  Dispatcher,
  NONE,
  sendRootEnd,
  sendRootInitial,
  sendRootNoInitial,
  Subscriber,
} from "./_core"
import { Transaction } from "./_tx"
import { AbortSubscriptionListener, AbortSubscriptionTask } from "./operators/_base"
import { Scheduler, Task } from "./scheduler/index"

export class EventStreamDispatcher<T> extends Dispatcher<T> {
  public initial(tx: Transaction, val: T): void {
    if (__DEVELOPER__) {
      logAndThrow("**BUG** EventStream multicast implementation received initial event")
    }
  }
  public noinitial(tx: Transaction): void {
    if (__DEVELOPER__) {
      logAndThrow("**BUG** EventStream multicast implementation received noinitial event")
    }
  }
}

export class PropertyDispatcher<T> extends Dispatcher<T> implements AbortSubscriptionListener<T> {
  private val: T = NONE
  private ended: boolean = false

  public beforeActivation(scheduler: Scheduler, subscriber: Subscriber<T>): boolean {
    if (this.ended) {
      scheduler.schedulePropertyActivation(new AbortSubscriptionTask(this, subscriber))
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
    this.dest.initial(tx, (this.val = val))
  }

  public noinitial(tx: Transaction): void {
    const currentValue = this.val
    currentValue === NONE ? this.dest.noinitial(tx) : this.dest.initial(tx, currentValue)
  }

  public next(tx: Transaction, val: T): void {
    this.dest.next(tx, (this.val = val))
  }

  public end(tx: Transaction): void {
    this.ended = true
    this.dest.end(tx)
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
  constructor(private dispatcher: PropertyDispatcher<T>, private dest: Subscriber<T>) {}
  public run(): void {
    this.dispatcher.handleReplayState(this.dest)
  }
}
