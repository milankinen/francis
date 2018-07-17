import { NOOP_SUBSCRIPTION, Source, Subscriber, Subscription } from "../_core"
import { Transaction } from "../_tx"

export interface Indexed<T> {
  idx: number
  val: T
}

export interface IndexedEndSubscriber<T> {
  iend(tx: Transaction, idx: number, source: IndexedSource<T>): void
}

const NOOP_IES = new class NoopIES {
  public iend(tx: Transaction, idx: number) {}
}()

export class IndexedSource<T> implements Source<Indexed<T>>, Subscription {
  public readonly weight: number

  private ies: IndexedEndSubscriber<T> = NOOP_IES
  private subs: Subscription[]

  constructor(private sources: Array<Source<T>>) {
    let totalWeight = 0
    let n = sources.length
    this.subs = Array(n)
    while (n--) {
      totalWeight += sources[n].weight
      this.subs[n] = NOOP_SUBSCRIPTION
    }
    this.weight = totalWeight
    this.subs = []
    this.ies = NOOP_IES
  }

  public activate(): void {
    const { subs } = this
    let n = subs.length
    while (n--) {
      subs[n].activate()
    }
  }

  public size(): number {
    return this.sources.length
  }

  public setEndSubscriber(ies: IndexedEndSubscriber<T>): void {
    this.ies = ies
  }

  public subscribe(subscriber: Subscriber<Indexed<T>>, order: number): Subscription {
    let n = this.sources.length
    const srcs = this.sources
    const subs = this.subs
    while (n--) {
      subs[n] = srcs[n].subscribe(new IndexedPipe(n, this, subscriber, this.ies), order)
    }
    return this
  }

  public disposeIdx(idx: number): void {
    const subs = this.subs[idx]
    this.subs[idx] = NOOP_SUBSCRIPTION
    subs.dispose()
  }

  public dispose(): void {
    let n = this.subs.length
    while (n--) this.disposeIdx(n)
  }

  public reorder(order: number): void {
    const { subs } = this
    let n = subs.length
    while (n--) {
      subs[n].reorder(order)
    }
  }
}

class IndexedPipe<T> implements Subscriber<T> {
  constructor(
    private i: number,
    private is: IndexedSource<T>,
    private s: Subscriber<Indexed<T>>,
    private ies: IndexedEndSubscriber<T>,
  ) {}

  public next(tx: Transaction, val: T): void {
    this.s.next(tx, { val, idx: this.i })
  }

  public error(tx: Transaction, err: Error): void {
    this.s.error(tx, err)
  }

  public end(tx: Transaction): void {
    this.ies.iend(tx, this.i, this.is)
  }
}
