import {
  NOOP_SUBSCRIBER,
  NOOP_SUBSCRIPTION,
  sendEndSafely,
  sendErrorSafely,
  sendEventSafely,
  sendInitialSafely,
  sendNoInitialSafely,
  Source,
  Subscriber,
  Subscription,
} from "../_core"
import { MAX_ORDER } from "../_priority"
import { Transaction } from "../_tx"
import { disableNoUnusedWarning } from "../_util"
import { Scheduler, Task } from "../scheduler/index"

export enum EventType {
  INITIAL = 1,
  NO_INITIAL,
  EVENT,
  ERROR,
  END,
}

/**
 * This function is meant for actual sources (e.g. once, fromArray etc..) to
 * enable multicasting (thus keeping the source's codebase clean)
 *
 * @param source Unicasted "bare" source
 */
export function identity<T>(source: Source<T>): Operator<T, T> {
  return new Identity(source)
}

export abstract class MulticastImplementation<T> implements Subscriber<T> {
  public readonly next: Subscriber<T> = NOOP_SUBSCRIBER

  /**
   * This hook is called every time when operator is activated (gets its first
   * subscriber). If this function returns false, operator aborts the current
   * subscription process. The impelementation may also queue tasks to the given
   * scheduler before returning.
   *
   * @param scheduler
   * @param subscriber
   */
  public beforeActivation(scheduler: Scheduler, subscriber: Subscriber<T>): boolean {
    return true
  }

  /**
   * This hook is called every time when operator is multicasted (gets a new subscriber
   * after initial activation). If this function returns false, operator aborts the current
   * subscription process. The impelementation may also queue tasks to the given
   * scheduler before returning.
   *
   * @param scheduler
   * @param subscriber
   */
  public beforeMulticast(scheduler: Scheduler, subscriber: Subscriber<T>): boolean {
    return true
  }

  public isActive(): boolean {
    return true
  }

  public initial(tx: Transaction, val: T): void {
    this.next.initial(tx, val)
  }

  public noinitial(tx: Transaction): void {
    this.next.noinitial(tx)
  }

  public event(tx: Transaction, val: T): void {
    this.next.event(tx, val)
  }

  public error(tx: Transaction, err: Error): void {
    this.next.error(tx, err)
  }

  public end(tx: Transaction): void {
    this.next.end(tx)
  }
}

const NOOP_MCAST = new class NoopImpl extends MulticastImplementation<any> {}()

export abstract class Operator<A, B>
  implements Subscriber<A>, Source<B>, AbortSubscriptionListener<B> {
  public readonly weight: number

  protected readonly order: number
  protected readonly source: Source<A>
  protected readonly next: MulticastImplementation<B> = NOOP_MCAST

  private __subs: Subscription = NOOP_SUBSCRIPTION
  private __active: boolean = false

  constructor(origin: Source<A>) {
    false && disableNoUnusedWarning(this.__handleDispose, this.__handeReorder)
    this.source = origin
    this.order = MAX_ORDER + 1
    this.weight = origin.weight
  }

  /**
   * Called only internally from Property and EventStream constructors
   * @param impl Multicast implementation to use for this operator
   */
  public setMulticastImplementation(impl: MulticastImplementation<B>): void {
    // tslint:disable-next-line:semicolon whitespace
    ;(this.next as MulticastImplementation<B>) = impl
  }

  /**
   * Called only internally when new EventStream or Property subscribes to this operator
   * during their activation.
   * @param scheduler
   * @param subscriber
   * @param order
   */
  public subscribe(scheduler: Scheduler, subscriber: Subscriber<B>, order: number): Subscription {
    const next = this.next.next
    return next === NOOP_SUBSCRIBER
      ? this.__handleActivation(scheduler, subscriber, order)
      : this.__handleMulticast(scheduler, subscriber, order)
  }

  public abstract initial(tx: Transaction, val: A): void

  public abstract event(tx: Transaction, val: A): void

  public noinitial(tx: Transaction): void {
    this.next.noinitial(tx)
  }

  public error(tx: Transaction, err: Error): void {
    this.next.error(tx, err)
  }

  public end(tx: Transaction): void {
    this.next.end(tx)
  }

  public isActive(): boolean {
    return this.__active
  }

  public handleAbort(subscriber: Subscriber<B>): void {}

  protected activateFirst(
    scheduler: Scheduler,
    subscriber: Subscriber<B>,
    order: number,
  ): Subscription {
    // TODO
    this.__active = true
    this.__subs = this.source.subscribe(scheduler, this, order)
    return new MulticastSubscription(subscriber, this as any)
  }

  protected activateLate(
    scheduler: Scheduler,
    subscriber: Subscriber<B>,
    order: number,
  ): Subscription {
    return new MulticastSubscription(subscriber, this as any)
  }

  protected abort(scheduler: Scheduler, subscriber: Subscriber<B>, order: number): Subscription {
    scheduler.scheduleAbortSubscription(new AbortSubscriptionTask(this, subscriber))
    return this.activateLate(scheduler, subscriber, order)
  }

  protected propagateReorder(order: number): void {
    this.__subs.reorder(order)
  }

  protected dispose(): void {
    this.__active = false
    this.__subs.dispose()
    this.__subs = NOOP_SUBSCRIPTION
  }

  protected handleActivation(
    scheduler: Scheduler,
    subscriber: Subscriber<B>,
    order: number,
  ): Subscription {
    return this.activateFirst(scheduler, subscriber, order)
  }

  protected handleMulticast(
    scheduler: Scheduler,
    subscriber: Subscriber<B>,
    order: number,
  ): Subscription {
    return this.activateLate(scheduler, subscriber, order)
  }

  protected handleReorder(order: number): void {
    this.propagateReorder(order)
  }

  protected handleDispose(): void {
    this.dispose()
  }

  private __updateNext(next: Subscriber<B>): void {
    // tslint:disable-next-line:semicolon whitespace
    ;(this.next.next as Subscriber<B>) = next
  }

  private __updateOrder(order: number): void {
    // tslint:disable-next-line:semicolon whitespace
    ;(this.order as number) = order
  }

  private __handleActivation(
    scheduler: Scheduler,
    subscriber: Subscriber<B>,
    order: number,
  ): Subscription {
    if (this.next.beforeActivation(scheduler, subscriber)) {
      this.__updateNext(subscriber)
      this.__updateOrder(order)
      return this.handleActivation(scheduler, subscriber, order)
    } else {
      return NOOP_SUBSCRIPTION
    }
  }

  private __handleMulticast(
    scheduler: Scheduler,
    subscriber: Subscriber<B>,
    order: number,
  ): Subscription {
    if (this.next.beforeMulticast(scheduler, subscriber)) {
      const next = this.next.next
      if (next instanceof MulticastDelegatee) {
        next.add(subscriber, order)
      } else {
        this.__updateNext(
          new MulticastDelegatee({ s: next, o: this.order }, { s: subscriber, o: order }),
        )
      }
      if (order < this.order) {
        this.__updateOrder(order)
        this.handleReorder(order)
      }
      return this.handleMulticast(scheduler, subscriber, order)
    } else {
      return NOOP_SUBSCRIPTION
    }
  }

  private __handleDispose(subscriber: Subscriber<B>): void {
    const next = this.next.next
    if (next instanceof MulticastDelegatee) {
      const { o: order, s: updated } = next.remove(subscriber)
      this.__updateNext(updated)
      if (order !== this.order) {
        this.__updateOrder(order)
        this.handleReorder(order)
        this.__subs.reorder(order)
      }
    } else {
      this.__updateNext(NOOP_SUBSCRIBER)
      this.__updateOrder(MAX_ORDER + 1)
      this.handleDispose()
    }
  }
  private __handeReorder(subscriber: Subscriber<B>, order: number): void {
    const next = this.next.next
    next instanceof MulticastDelegatee && next.updateOrder(subscriber, order)
    if (order < this.order) {
      this.__updateOrder(order)
      this.handleReorder(order)
    }
  }
}

export interface AbortSubscriptionListener<T> {
  handleAbort(subsciber: Subscriber<T>): void
}

export class AbortSubscriptionTask<T> implements Task {
  constructor(private li: AbortSubscriptionListener<T>, private subscriber: Subscriber<T>) {}

  public run(): void {
    this.li.handleAbort(this.subscriber)
  }
}

const NIL: OrderedSubscriberNode<any> = {
  a: false,
  n: null as any,
  o: MAX_ORDER + 1,
  s: NOOP_SUBSCRIBER,
}

class MulticastDelegatee<T> implements Subscriber<T> {
  private n: number
  private head: OrderedSubscriberNode<T>
  private tail: OrderedSubscriberNode<T>

  constructor(a: OrderedSubscriber<T>, b: OrderedSubscriber<T>) {
    this.head = this.tail = NIL
    this.head = { ...a, a: true, n: this.head }
    this.head = { ...b, a: true, n: this.head }
    this.n = 2
  }

  public add(subscriber: Subscriber<T>, order: number): void {
    this.head = { o: order, s: subscriber, a: true, n: this.head }
    ++this.n
  }

  public remove(subscriber: Subscriber<T>): OrderedSubscriber<T> {
    let prev = NIL
    let next = this.head
    let order = MAX_ORDER + 1
    while (next !== NIL) {
      if (next.s === subscriber) {
        next.a = false
        prev !== NIL ? (prev.n = next.n) : (this.head = next.n)
        --this.n
      } else if (next.o < order) {
        order = next.o
      }
      prev = next
      next = next.n
    }
    return {
      o: order,
      s: this.n > 1 ? this : this.head.s,
    }
  }

  public updateOrder(subscriber: Subscriber<T>, order: number): void {
    let next = this.head
    while (next !== NIL) {
      if (next.s === subscriber) {
        next.o = order
        return
      } else {
        next = next.n
      }
    }
  }

  public isActive(): boolean {
    return true
  }

  public initial(tx: Transaction, val: T): void {
    let next = this.head
    while (next !== NIL) {
      next.a && sendInitialSafely(tx, next.s, val)
      next = next.n
    }
  }

  public noinitial(tx: Transaction): void {
    let next = this.head
    while (next !== NIL) {
      next.a && sendNoInitialSafely(tx, next.s)
      next = next.n
    }
  }

  public event(tx: Transaction, val: T): void {
    let next = this.head
    while (next !== NIL) {
      next.a && sendEventSafely(tx, next.s, val)
      next = next.n
    }
  }

  public error(tx: Transaction, err: Error): void {
    let next = this.head
    while (next !== NIL) {
      next.a && sendErrorSafely(tx, next.s, err)
      next = next.n
    }
  }

  public end(tx: Transaction): void {
    let next = this.head
    while (next !== NIL) {
      next.a && sendEndSafely(tx, next.s)
      next = next.n
    }
  }
}

interface OrderedSubscriberNode<T> extends OrderedSubscriber<T> {
  n: OrderedSubscriberNode<T>
  a: boolean
}

class MulticastSubscription<T> implements Subscription {
  private s: Subscriber<T>
  private o: MulticastSubscriptionOwner<T>

  // tslint:disable-next-line:ban-types
  constructor(subscriber: Subscriber<T>, owner: MulticastSubscriptionOwner<T>) {
    this.s = subscriber
    this.o = owner
  }

  public dispose(): void {
    this.o.__handleDispose(this.s)
  }

  public reorder(order: number): void {
    this.o.__handeReorder(this.s, order)
  }
}

interface MulticastSubscriptionOwner<T> {
  __handleDispose(subscriber: Subscriber<T>): void
  __handeReorder(subscriber: Subscriber<T>, order: number): void
}

interface OrderedSubscriber<T> {
  s: Subscriber<T>
  o: number
}

class Identity<T> extends Operator<T, T> {
  public initial(tx: Transaction, val: T): void {
    this.next.initial(tx, val)
  }
  public event(tx: Transaction, val: T): void {
    this.next.event(tx, val)
  }
}
