import { NONE, NOOP_SUBSCRIBER, sendEndInTx, sendNextInTx, Subscriber, Subscription } from "./_core"
import { Dispatcher, MCSNode } from "./_dispatcher"
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
  protected has: boolean = false
  protected val: T = NONE
  protected ended: boolean = false

  public subscribe(subscriber: Subscriber<T>, order: number): Subscription {
    return this.ended === true
      ? new PropertyEndedSubscription(this, subscriber)
      : super.subscribe(subscriber, order)
  }

  public activate(subscriber: Subscriber<T>, initialNeeded: boolean): void {
    const isLateActivation = this.active
    super.activate(subscriber, initialNeeded)
    const noSourceInitialDuringFirstActivation = !isLateActivation && !this.has
    if (
      this.active &&
      (isLateActivation || noSourceInitialDuringFirstActivation) &&
      initialNeeded
    ) {
      this.replayState(subscriber)
    }
  }

  public dispose(node: MCSNode<T>): void {
    super.dispose(node)
    if (this.active === false) {
      this.has = false
    }
  }

  public next(tx: Transaction, val: T): void {
    this.has = true
    this.sink.next(tx, (this.val = val))
  }

  public end(tx: Transaction): void {
    this.ended = true
    this.sink.end(tx)
  }

  public replayState(subscriber: Subscriber<T>): void {
    const { val, ended } = this
    if (val !== NONE) {
      sendNextInTx(subscriber, val)
    }
    if (ended === true) {
      sendEndInTx(subscriber)
    }
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
