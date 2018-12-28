import { NONE, NOOP_SUBSCRIBER, sendEndInTx, sendNextInTx, Subscriber, Subscription } from "./_core"
import { Dispatcher } from "./_dispatcher"
import { Transaction } from "./_tx"
import { is } from "./_util"
import { Observable } from "./Observable"

export class Property<A> extends Observable<A> {
  constructor(d: PropertyDispatcher<A>) {
    super(d)
  }
}

export function isProperty<T>(x: any): x is Property<T> {
  return is(x, Property)
}

export class PropertyDispatcher<T> extends Dispatcher<T> {
  private val: T = NONE
  private ended: boolean = false

  public subscribe(subscriber: Subscriber<T>, order: number): Subscription {
    return this.ended === true
      ? new PropertyEndedSubscription(this, subscriber)
      : super.subscribe(subscriber, order)
  }

  public activate(subscriber: Subscriber<T>, initialNeeded: boolean): void {
    super.activate(subscriber, initialNeeded && this.replayState(subscriber))
  }

  public next(tx: Transaction, val: T): void {
    this.sink.next(tx, (this.val = val))
  }

  public end(tx: Transaction): void {
    this.ended = true
    this.sink.end(tx)
  }

  public replayState(subscriber: Subscriber<T>): boolean {
    const { val, ended } = this
    const hasVal = val !== NONE
    const hasInitial = hasVal || ended
    if (hasInitial) {
      hasVal && sendNextInTx(subscriber, val)
      ended === true && sendEndInTx(subscriber)
    }
    return !hasInitial
  }
}

class PropertyEndedSubscription<T> implements Subscription {
  constructor(private d: PropertyDispatcher<any>, private s: Subscriber<T>) {}

  public activate(initialNeeded: boolean): void {
    this.d.replayState(this.s)
  }
  public dispose(): void {
    this.s = NOOP_SUBSCRIBER
  }
  public reorder(order: number): void {
    // noop
  }
}
