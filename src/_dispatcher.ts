import { NONE, NOOP_SUBSCRIBER, NOOP_SUBSCRIPTION, Source, Subscriber, Subscription } from "./_core"
import { Transaction } from "./_tx"
import { Operator } from "./operators/_base"

export abstract class Dispatcher<T> implements Subscriber<T>, Source<T> {
  public readonly weight: number
  protected sink: Subscriber<T> = NOOP_SUBSCRIBER
  protected subs: Subscription = NOOP_SUBSCRIPTION
  protected ord: number = -1
  protected active: boolean = false
  protected msc: MulticastSubscriber<T> = NONE

  constructor(protected source: Operator<any, T>) {
    this.weight = source.weight
  }

  public subscribe(subscriber: Subscriber<T>, order: number): Subscription {
    if (this.msc === NONE) {
      return this.firstSubscribe(subscriber, order)
    } else {
      // a.k.a "multicast"
      return this.lateSubscribe(subscriber, order)
    }
  }

  public activate(subscriber: Subscriber<T>, initialNeeded: boolean): void {
    if (!this.active) {
      this.active = true
      this.subs.activate(initialNeeded)
    }
  }

  public dispose(node: MCSNode<T>): void {
    const { sink, msc } = this
    if (sink === msc) {
      const { order, next } = msc.remove(node)
      this.sink = next
      if (order !== this.ord) {
        this.subs.reorder((this.ord = order))
      }
    } else {
      const { subs } = this
      this.sink = NOOP_SUBSCRIBER
      this.subs = NOOP_SUBSCRIPTION
      this.msc = NONE
      this.ord = -1
      this.active = false
      subs.dispose()
    }
  }

  public reorder(order: number): void {
    if (order > this.ord) {
      this.subs.reorder((this.ord = order))
    }
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

  protected firstSubscribe(subscriber: Subscriber<T>, order: number): Subscription {
    const node = mcsNode(subscriber, order)
    this.msc = new MulticastSubscriber<T>(node)
    this.ord = order
    this.sink = subscriber
    this.subs = this.source.subscribe(this, order)
    return this.makeSubs(node)
  }

  protected lateSubscribe(subscriber: Subscriber<T>, order: number): Subscription {
    const { sink, msc } = this
    const node = mcsNode(subscriber, order)
    msc.add(node)
    if (sink !== msc) {
      this.sink = this.msc
    }
    this.reorder(order)
    return this.makeSubs(node)
  }

  private makeSubs(mcs: MCSNode<T>): Subscription {
    return new MulticastSubscription(mcs, this)
  }
}

class MulticastSubscriber<T> implements Subscriber<T> {
  private h: MCSNode<T> | null
  private t: MCSNode<T> | null

  constructor(head: MCSNode<T>) {
    this.h = this.t = head
  }

  public add(node: MCSNode<T>): void {
    const { h } = this
    node.t = h
    h !== null && (h.h = node)
    this.h = node
  }

  public remove(node: MCSNode<T>): { order: number; next: Subscriber<T> } {
    node.h !== null ? (node.h.t = node.t) : (this.h = node.t)
    node.t !== null ? (node.t.h = node.h) : (this.t = node.h)
    let head = this.h
    let order = -1
    while (head !== null) {
      if (head.o > order) {
        order = head.o
      }
      head = head.t
    }
    head = this.h as MCSNode<T>
    return {
      next: head.t !== null ? this : head.s,
      order,
    }
  }

  public next(tx: Transaction, val: T): void {
    let head = this.h
    while (head !== null) {
      head.a && head.s.next(tx, val)
      head = head.t
    }
  }

  public error(tx: Transaction, err: Error): void {
    let head = this.h
    while (head !== null) {
      head.a && head.s.error(tx, err)
      head = head.t
    }
  }

  public end(tx: Transaction): void {
    let head = this.h
    while (head !== null) {
      head.a && head.s.end(tx)
      head = head.t
    }
  }
}

function mcsNode<T>(subscriber: Subscriber<T>, order: number): MCSNode<T> {
  return {
    a: false,
    h: null,
    o: order,
    s: subscriber,
    t: null,
  }
}

interface MCSNode<T> {
  s: Subscriber<T> // subscriber
  o: number // order
  a: boolean // active/inactive
  h: MCSNode<T> | null // head
  t: MCSNode<T> | null // tail
}

class MulticastSubscription<T> implements Subscription {
  private n: MCSNode<T>
  private d: Dispatcher<T>

  constructor(mcs: MCSNode<T>, dispatcher: Dispatcher<T>) {
    this.n = mcs
    this.d = dispatcher
  }

  public activate(initialNeeded: boolean): void {
    this.n.a = true
    this.d.activate(this.n.s, initialNeeded)
  }

  public dispose(): void {
    this.n.a = false
    this.d.dispose(this.n)
  }

  public reorder(order: number): void {
    this.d.reorder((this.n.o = order))
  }
}
