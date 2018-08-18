import { NOOP_SUBSCRIBER, NOOP_SUBSCRIPTION, Source, Subscriber, Subscription } from "../_core"
import { Transaction } from "../_tx"

// TODO: flatten to constants
export enum EventType {
  NEXT = 1,
  ERROR = 2,
  END = 3,
}

export abstract class Operator<A, B> implements Subscriber<A>, Source<B>, Subscription {
  public readonly weight: number

  protected sink: Subscriber<B> = NOOP_SUBSCRIBER
  protected active: boolean = false
  protected ord: number = -1
  protected subs: Subscription = NOOP_SUBSCRIPTION

  constructor(protected source: Source<A>) {
    this.weight = source.weight
  }

  public subscribe(subscriber: Subscriber<B>, order: number): Subscription {
    this.init(subscriber, order, this.source.subscribe(this, order))
    return this
  }

  public activate(initialNeeded: boolean): void {
    this.subs.activate(initialNeeded)
  }

  public reorder(order: number): void {
    this.ord = order
    this.subs.reorder(order)
  }

  public dispose(): void {
    const { subs } = this
    this.sink = NOOP_SUBSCRIBER
    this.subs = NOOP_SUBSCRIPTION
    this.active = false
    this.ord = -1
    subs.dispose()
  }

  public abstract next(tx: Transaction, val: A): void

  public error(tx: Transaction, err: Error): void {
    this.sink.error(tx, err)
  }

  public end(tx: Transaction): void {
    this.sink.end(tx)
  }

  protected init(subscriber: Subscriber<B>, order: number, subscription: Subscription): void {
    this.active = true
    this.sink = subscriber
    this.ord = order
    this.subs = subscription
  }
}

export interface PipeSubscriber<T> {
  pipedNext(sender: Pipe<T>, tx: Transaction, val: T): void
  pipedError(sender: Pipe<T>, tx: Transaction, err: Error): void
  pipedEnd(sender: Pipe<T>, tx: Transaction): void
}

export class Pipe<T> implements Subscriber<T> {
  constructor(public s: PipeSubscriber<T>) {}

  public next(tx: Transaction, val: T): void {
    this.s.pipedNext(this, tx, val)
  }

  public error(tx: Transaction, err: Error): void {
    this.s.pipedError(this, tx, err)
  }

  public end(tx: Transaction): void {
    this.s.pipedEnd(this, tx)
  }
}

export class LinkedPipe<T> extends Pipe<T> {
  constructor(
    s: PipeSubscriber<T>,
    public h: LinkedPipe<T> | null,
    public t: LinkedPipe<T> | null,
  ) {
    super(s)
  }
}

export class LinkedPipeList<T> {
  public size: number
  private t: LinkedPipe<T> | null
  private h: LinkedPipe<T> | null

  constructor(subscribers: Array<PipeSubscriber<T>>) {
    this.size = subscribers.length
    if (subscribers.length === 0) {
      this.t = this.h = null
    } else {
      let tail = (this.h = new LinkedPipe(subscribers[0], null, null))
      for (let i = 0; i < this.size; i++) {
        tail = tail.t = new LinkedPipe(subscribers[i], tail, null)
      }
      this.t = tail
    }
  }

  public head(): LinkedPipe<T> | null {
    return this.h
  }

  public append(subscriber: PipeSubscriber<T>): LinkedPipe<T> {
    const node = (this.t = new LinkedPipe(subscriber, this.h, null))
    this.h === null && (this.h = node)
    ++this.size
    return node
  }

  public remove(node: LinkedPipe<T>): void {
    node.h !== null ? (node.h.t = node.t) : (this.h = node.t)
    node.t !== null ? (node.t.h = node.h) : (this.t = node.h)
    --this.size
  }

  public clear(): void {
    this.h = this.t = null
    this.size = 0
  }
}

export class Identity<T> extends Operator<T, T> {
  public next(tx: Transaction, val: T): void {
    this.sink.next(tx, val)
  }
}
