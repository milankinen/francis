import { NOOP_SUBSCRIBER, NOOP_SUBSCRIPTION, Source, Subscriber, Subscription } from "../_core"
import { Transaction } from "../_tx"
import { Scheduler } from "../scheduler/index"

export enum EventType {
  EMPTY = 1,
  NEXT,
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

export abstract class Operator<A, B> implements Subscriber<A>, Source<B>, Subscription {
  public readonly weight: number

  protected sink: Subscriber<B> = NOOP_SUBSCRIBER
  protected active: boolean = false
  protected ord: number = -1
  protected subs: Subscription = NOOP_SUBSCRIPTION

  constructor(protected source: Source<A>) {
    this.weight = source.weight
  }

  public subscribe(scheduler: Scheduler, subscriber: Subscriber<B>, order: number): Subscription {
    this.init(subscriber, order, this.source.subscribe(scheduler, this, order))
    return this
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

  public begin(): boolean {
    return this.sink.begin()
  }

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

class Identity<T> extends Operator<T, T> {
  public next(tx: Transaction, val: T): void {
    this.sink.next(tx, val)
  }
}
