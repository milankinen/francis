import { __DEVBUILD__, assert } from "../_assert"
import {
  NOOP_SUBSCRIPTION,
  sendEndSafely,
  sendErrorSafely,
  sendNextSafely,
  Source,
  Subscription,
} from "../_core"
import { Projection } from "../_interfaces"
import { toObservable } from "../_interrop"
import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { MAX_SAFE_INTEGER } from "../_util"
import { EventStream } from "../EventStream"
import { Observable } from "../Observable"
import { Property } from "../Property"
import { stepIn, stepOut } from "../scheduler/index"
import { JoinOperator } from "./_join"
import { Pipe, PipeDest } from "./_pipe"

export function flatMapLatest<A, B>(
  project: Projection<A, B | Observable<B>>,
  stream: EventStream<A>,
): EventStream<B>
export function flatMapLatest<A, B>(
  project: Projection<A, B | Observable<B>>,
  property: Property<A>,
): Property<B>
export function flatMapLatest<A, B>(
  project: Projection<A, B | Observable<B>>,
  observable: Observable<A>,
): Observable<B>
export function flatMapLatest<A, B>(
  project: Projection<A, B | Observable<B>>,
  observable: Observable<A>,
): Observable<B> {
  return makeObservable(observable, new FlatMapLatest(observable.src, project))
}

export function flatMapFirst<A, B>(
  project: Projection<A, B | Observable<B>>,
  stream: EventStream<A>,
): EventStream<B>
export function flatMapFirst<A, B>(
  project: Projection<A, B | Observable<B>>,
  property: Property<A>,
): Property<B>
export function flatMapFirst<A, B>(
  project: Projection<A, B | Observable<B>>,
  observable: Observable<A>,
): Observable<B>
export function flatMapFirst<A, B>(
  project: Projection<A, B | Observable<B>>,
  observable: Observable<A>,
): Observable<B> {
  return makeObservable(observable, new FlatMapFirst(observable.src, project))
}

export function flatMapConcat<A, B>(
  project: Projection<A, B | Observable<B>>,
  stream: EventStream<A>,
): EventStream<B>
export function flatMapConcat<A, B>(
  project: Projection<A, B | Observable<B>>,
  property: Property<A>,
): Property<B>
export function flatMapConcat<A, B>(
  project: Projection<A, B | Observable<B>>,
  observable: Observable<A>,
): Observable<B>
export function flatMapConcat<A, B>(
  project: Projection<A, B | Observable<B>>,
  observable: Observable<A>,
): Observable<B> {
  return flatMapWithConcurrencyLimit(1, project, observable)
}

export function flatMap<A, B>(
  project: Projection<A, B | Observable<B>>,
  stream: EventStream<A>,
): EventStream<B>
export function flatMap<A, B>(
  project: Projection<A, B | Observable<B>>,
  property: Property<A>,
): Property<B>
export function flatMap<A, B>(
  project: Projection<A, B | Observable<B>>,
  observable: Observable<A>,
): Observable<B>
export function flatMap<A, B>(
  project: Projection<A, B | Observable<B>>,
  observable: Observable<A>,
): Observable<B> {
  return flatMapWithConcurrencyLimit(MAX_SAFE_INTEGER, project, observable)
}

export function flatMapWithConcurrencyLimit<A, B>(
  limit: number,
  project: Projection<A, B | Observable<B>>,
  stream: EventStream<A>,
): EventStream<B>
export function flatMapWithConcurrencyLimit<A, B>(
  limit: number,
  project: Projection<A, B | Observable<B>>,
  property: Property<A>,
): Property<B>
export function flatMapWithConcurrencyLimit<A, B>(
  limit: number,
  project: Projection<A, B | Observable<B>>,
  observable: Observable<A>,
): Observable<B>
export function flatMapWithConcurrencyLimit<A, B>(
  limit: number,
  project: Projection<A, B | Observable<B>>,
  observable: Observable<A>,
): Observable<B> {
  if (__DEVBUILD__) {
    assert(
      parseInt(limit as any, 10) === limit && limit > 0,
      "Concurrency limit must be a positive integer",
    )
  }
  return makeObservable(observable, new FlatMapConcurrent(observable.src, project, limit))
}

abstract class FlatMapBase<A, B> extends JoinOperator<A, B, B> implements PipeDest<B> {
  protected outerEnded: boolean = false
  private otx: Transaction | null = null

  constructor(source: Source<A>, protected readonly proj: Projection<A, B | Observable<B>>) {
    super(source)
  }

  public reorder(order: number): void {
    this.innerReorder(order)
    super.reorder(order)
  }

  public dispose(): void {
    this.outerEnded = false
    this.abortJoin()
    this.disposeInner()
    this.disposeOuter()
    super.dispose()
  }

  public next(tx: Transaction, val: A): void {
    const result = this.outerNext(tx, val)
    if (result !== null) {
      const { purge, subscription } = result
      purge && this.abortJoin()
      // using outer tx as primary tx allows us to "break out" from inner transactions
      // and wait for join => we can achieve transaction semantics from inner+outer emissions
      const otx = this.otx
      this.otx = tx
      activateInnerSubscription(subscription)
      this.otx = otx
    }
  }

  public end(tx: Transaction): void {
    this.outerEnded = true
    if (this.isInnerEnded()) {
      this.sink.end(tx)
    } else {
      this.disposeOuter()
    }
  }

  public pipedBegin(sender: Pipe<B>): boolean {
    return this.sink.begin()
  }

  public pipedNext(sender: Pipe<B>, tx: Transaction, val: B): void {
    this.forkNext(this.otx || tx, val)
  }

  public pipedError(sender: Pipe<B>, tx: Transaction, err: Error): void {
    this.forkError(this.otx || tx, err)
  }

  public pipedEnd(sender: Pipe<B>, tx: Transaction): void {
    // we need sender later so queue end as custom event
    this.forkCustom(this.otx || tx, sender)
  }

  protected joinNext(tx: Transaction, val: B): void {
    sendNextSafely(tx, this.sink, val)
  }

  protected joinError(tx: Transaction, err: Error): void {
    sendErrorSafely(tx, this.sink, err)
  }

  protected joinCustom(tx: Transaction, sender: any): void {
    this.joinInnerEnd(tx, sender)
  }

  protected abstract disposeInner(): void

  protected abstract isInnerEnded(): boolean

  protected abstract innerEnd(sender: Pipe<B>): HandleInnerEndResult

  protected abstract innerReorder(order: number): void

  protected abstract outerNext(tx: Transaction, val: A): HandleOuterNextResult | null

  private joinInnerEnd(tx: Transaction, sender: Pipe<B>): void {
    const { ended, subscription } = this.innerEnd(sender)
    if (ended && this.outerEnded) {
      sendEndSafely(tx, this.sink)
    } else if (subscription !== null) {
      activateInnerSubscription(subscription)
    }
  }

  private disposeOuter(): void {
    const { subs } = this
    this.subs = NOOP_SUBSCRIPTION
    subs.dispose()
  }
}

function activateInnerSubscription(subscription: Subscription) {
  stepIn()
  subscription.activate()
  stepOut()
}

enum IStatus {
  IDLE = 0,
  RUNNING = 1,
  ENDED = 2,
}

const { IDLE, RUNNING, ENDED } = IStatus

abstract class FlatMapSwitchable<A, B> extends FlatMapBase<A, B> {
  protected isubs: Subscription = NOOP_SUBSCRIPTION
  protected istat: IStatus = IDLE

  protected switch(tx: Transaction, val: A): HandleOuterNextResult | null {
    const { isubs, proj } = this
    const inner = toObservable<B, Observable<B>>(proj(val))
    const innerSource = inner.src
    const subscription = (this.isubs = innerSource.subscribe(new Pipe(this), this.ord + 1))
    this.istat = RUNNING
    isubs.dispose()
    return { subscription, purge: true }
  }

  protected isInnerEnded(): boolean {
    return this.istat !== RUNNING
  }

  protected innerReorder(order: number): void {
    this.isubs.reorder(order + 1)
  }

  protected innerEnd(sender: Pipe<B>): HandleInnerEndResult {
    this.disposeInner()
    this.istat = ENDED
    return { ended: true, subscription: null }
  }

  protected disposeInner(): void {
    const isRunning = this.istat === RUNNING
    this.istat = IDLE
    if (isRunning) {
      const { isubs } = this
      this.isubs = NOOP_SUBSCRIPTION
      isubs.dispose()
    }
  }
}

class FlatMapLatest<A, B> extends FlatMapSwitchable<A, B> {
  protected outerNext(tx: Transaction, val: A): HandleOuterNextResult | null {
    return this.switch(tx, val)
  }
}

class FlatMapFirst<A, B> extends FlatMapSwitchable<A, B> {
  protected outerNext(tx: Transaction, val: A): HandleOuterNextResult | null {
    if (this.istat !== RUNNING) {
      return this.switch(tx, val)
    } else {
      return null
    }
  }
}

class FlatMapConcurrent<A, B> extends FlatMapBase<A, B> {
  private itail: InnerPipe<B> | null = null
  private ihead: InnerPipe<B> | null = null
  private ni: number = 0

  constructor(source: Source<A>, proj: Projection<A, B | Observable<B>>, private limit: number) {
    super(source, proj)
  }

  protected isInnerEnded(): boolean {
    return this.ni === 0
  }

  protected outerNext(tx: Transaction, val: A): HandleOuterNextResult | null {
    const project = this.proj
    const innerObs = toObservable<B, Observable<B>>(project(val))
    const innerSource = innerObs.src
    const inner = new InnerPipe(this, innerSource)
    if (this.append(inner) <= this.limit) {
      const subscription = this.subscribeHead()
      return { subscription, purge: false }
    } else {
      return null
    }
  }

  protected innerReorder(order: number): void {
    let inner = this.ihead
    while (inner !== null) {
      inner.subs.reorder(order)
      inner = inner.t
    }
  }

  protected innerEnd(pipe: Pipe<B>): HandleInnerEndResult {
    const inner = pipe as InnerPipe<B>
    const n = --this.ni
    const subs = inner.subs
    inner.subs = NOOP_SUBSCRIPTION
    inner.t = null
    subs.dispose()
    if (this.ihead !== null) {
      const subscription = this.subscribeHead()
      return { ended: false, subscription }
    } else {
      return { ended: n === 0, subscription: null }
    }
  }

  protected disposeInner(): void {
    let inner = this.itail
    this.itail = this.ihead = null
    this.ni = 0
    while (inner !== null) {
      const subs = inner.subs
      inner.subs = NOOP_SUBSCRIPTION
      subs.dispose()
      inner = inner.t
    }
  }

  private append(inner: InnerPipe<B>): number {
    if (this.itail === null) {
      this.itail = inner
    } else {
      this.itail = this.itail.t = inner
    }
    this.ihead === null && (this.ihead = this.itail)
    return ++this.ni
  }

  private subscribeHead(): Subscription {
    const inner = this.ihead as InnerPipe<B>
    this.ihead = inner.t
    inner.subs = inner.src.subscribe(inner, this.ord + 1)
    return inner.subs
  }
}

class InnerPipe<T> extends Pipe<T> {
  public t: InnerPipe<T> | null = null
  public subs: Subscription = NOOP_SUBSCRIPTION
  constructor(dest: PipeDest<T>, public src: Source<T>) {
    super(dest)
  }
}

interface HandleOuterNextResult {
  subscription: Subscription
  purge: boolean
}

interface HandleInnerEndResult {
  ended: boolean
  subscription: Subscription | null
}
