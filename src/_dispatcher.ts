import {
  NOOP_SUBSCRIBER,
  NOOP_SUBSCRIPTION,
  sendEndSafely,
  sendErrorSafely,
  sendNextSafely,
  Source,
  Subscriber,
  Subscription,
} from "./_core"
import { Transaction } from "./_tx"
import { Operator } from "./operators/_base"
import { Scheduler } from "./scheduler/index"

export abstract class Dispatcher<T> implements Subscriber<T>, Source<T> {
  public readonly weight: number
  protected sink: Subscriber<T> = NOOP_SUBSCRIBER
  protected subs: Subscription = NOOP_SUBSCRIPTION
  protected ord: number = -1

  constructor(protected source: Operator<any, T>) {
    this.weight = source.weight
  }

  public subscribe(scheduler: Scheduler, subscriber: Subscriber<T>, order: number): Subscription {
    if (this.sink === NOOP_SUBSCRIBER) {
      return this.activate(scheduler, subscriber, order)
    } else {
      return this.multicast(scheduler, subscriber, order)
    }
  }

  public begin(): boolean {
    return this.sink.begin()
  }

  public next(tx: Transaction, val: T): void {
    this.sink.next(tx, val)
  }

  public error(tx: Transaction, err: Error): void {
    this.sink.error(tx, err)
  }

  public end(tx: Transaction): void {
    this.sink.end(tx)
  }

  public dispose(subscriber: Subscriber<T>): void {
    const { sink } = this
    if (sink instanceof MulticastSubscriber) {
      const { o: order, s: next } = sink.remove(subscriber)
      this.sink = next
      if (order !== this.ord) {
        this.subs.reorder((this.ord = order))
      }
    } else {
      const { subs } = this
      this.sink = NOOP_SUBSCRIBER
      this.subs = NOOP_SUBSCRIPTION
      this.ord = -1
      subs.dispose()
    }
  }

  public reorder(subscriber: Subscriber<T>, order: number): void {
    const { sink } = this
    if (sink instanceof MulticastSubscriber) {
      sink.handleReorder(subscriber, order)
    }
    if (order < this.ord) {
      this.subs.reorder((this.ord = order))
    }
  }

  protected activate(scheduler: Scheduler, subscriber: Subscriber<T>, order: number): Subscription {
    this.ord = order
    this.sink = subscriber
    this.subs = this.source.subscribe(scheduler, this, order)
    return this.makeSubs(subscriber)
  }

  protected multicast(
    scheduler: Scheduler,
    subscriber: Subscriber<T>,
    order: number,
  ): Subscription {
    const { sink } = this
    if (sink instanceof MulticastSubscriber) {
      sink.add(subscriber, order)
    } else {
      this.sink = new MulticastSubscriber({ s: sink, o: this.ord }, { s: subscriber, o: order })
    }
    if (order > this.ord) {
      this.subs.reorder((this.ord = order))
    }
    return this.makeSubs(subscriber)
  }

  private makeSubs(subscriber: Subscriber<T>): Subscription {
    return new MulticastSubscription(subscriber, this)
  }
}

const NIL: MCSNode<any> = {
  a: false,
  n: null as any,
  o: -1,
  s: NOOP_SUBSCRIBER,
}

class MulticastSubscriber<T> implements Subscriber<T> {
  private n: number
  private head: MCSNode<T>
  private tail: MCSNode<T>

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
    let order = -1
    while (next !== NIL) {
      if (next.s === subscriber) {
        next.a = false
        prev !== NIL ? (prev.n = next.n) : (this.head = next.n)
        --this.n
      } else if (next.o > order) {
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

  public handleReorder(subscriber: Subscriber<T>, order: number): void {
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

  public begin(): boolean {
    let res = true
    let next = this.head
    while (next !== NIL) {
      next.a && (res = next.s.begin() && res)
      next = next.n
    }
    return res
  }

  public next(tx: Transaction, val: T): void {
    let next = this.head
    while (next !== NIL) {
      next.a && sendNextSafely(tx, next.s, val)
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

interface MCSNode<T> extends OrderedSubscriber<T> {
  n: MCSNode<T>
  a: boolean
}

class MulticastSubscription<T> implements Subscription {
  private s: Subscriber<T>
  private d: Dispatcher<T>

  constructor(subscriber: Subscriber<T>, dispatcher: Dispatcher<T>) {
    this.s = subscriber
    this.d = dispatcher
  }

  public dispose(): void {
    this.d.dispose(this.s)
  }

  public reorder(order: number): void {
    this.d.reorder(this.s, order)
  }
}

interface OrderedSubscriber<T> {
  s: Subscriber<T>
  o: number
}
