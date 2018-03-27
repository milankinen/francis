import { NOOP_SUBSCRIPTION, Source, Subscriber, Subscription } from "../_core"
import { Transaction } from "../_tx"
import { Scheduler } from "../scheduler/index"

export interface Indexed<T> {
  idx: number
  val: T
}

export interface IndexedEndSubscriber {
  iend(tx: Transaction, idx: number): void
}

const NOOP_IES = new class NoopIES {
  public iend(tx: Transaction, idx: number) {}
}()

export class IndexedSource<T> implements Source<Indexed<T>>, Subscription {
  public weight: number

  private ies: IndexedEndSubscriber
  private subs: Subscription[]

  constructor(private sources: Array<Source<T>>) {
    let w = 0
    let n = sources.length
    this.subs = Array(n)
    while (n--) {
      w += sources[n].weight
      this.subs[n] = NOOP_SUBSCRIPTION
    }
    this.weight = w
    this.subs = []
    this.ies = NOOP_IES
  }

  public size(): number {
    return this.sources.length
  }

  public setEndSubscriber(ies: IndexedEndSubscriber): void {
    this.ies = ies
  }

  public subscribe(
    scheduler: Scheduler,
    subscriber: Subscriber<Indexed<T>>,
    order: number,
  ): Subscription {
    let n = this.sources.length
    const srcs = this.sources
    const subs = this.subs
    while (n--) {
      subs[n] = srcs[n].subscribe(scheduler, new IndexedPipe(n, subscriber, this.ies), order)
    }
    return this
  }

  public disposeIdx(idx: number): void {
    this.subs[idx].dispose()
    this.subs[idx] = NOOP_SUBSCRIPTION
  }

  public dispose(): void {
    let n = this.subs.length
    while (n--) this.disposeIdx(n)
  }

  public reorder(order: number): void {
    const subs = this.subs
    let n = subs.length
    while (n--) {
      subs[n].reorder(order)
    }
  }
}

class IndexedPipe<T> implements Subscriber<T> {
  constructor(
    private i: number,
    private next: Subscriber<Indexed<T>>,
    private ies: IndexedEndSubscriber,
  ) {}

  public isActive(): boolean {
    return this.next.isActive()
  }

  public initial(tx: Transaction, val: T): void {
    this.next.initial(tx, { val, idx: this.i })
  }

  public noinitial(tx: Transaction): void {
    this.next.noinitial(tx)
  }

  public event(tx: Transaction, val: T): void {
    this.next.event(tx, { val, idx: this.i })
  }

  public error(tx: Transaction, err: Error): void {
    this.next.error(tx, err)
  }

  public end(tx: Transaction): void {
    this.ies.iend(tx, this.i)
  }
}
