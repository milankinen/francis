import { __DEVBUILD__, assert } from "../_assert"
import {
  NOOP_SUBSCRIPTION,
  sendEndSafely,
  sendErrorSafely,
  sendInitialSafely,
  sendNextSafely,
  sendNoInitialSafely,
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
import { getInnerScheduler, Scheduler } from "../scheduler/index"
import { EventType } from "./_base"
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
  return makeObservable(new FlatMapLatest(observable.op, project))
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
  return makeObservable(new FlatMapFirst(observable.op, project))
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
  return makeObservable(new FlatMapConcurrent(observable.op, project, limit))
}

abstract class FlatMapBase<A, B> extends JoinOperator<A, B> implements PipeDest<B> {
  protected readonly outerEnded: boolean = false
  private initStage: boolean = false
  private qHead: QueuedEvent<B> | null = null
  private qTail: QueuedEvent<B> | null = null
  private outerTx: Transaction | null = null

  constructor(source: Source<A>, protected readonly proj: Projection<A, B | Observable<B>>) {
    super(source, source.sync)
  }

  public isActive(): boolean {
    return this.isInnerEnded() === false || super.isActive()
  }

  public initial(tx: Transaction, val: A): void {
    this.initStage = true
    this.next(tx, val)
    this.initStage = false
  }

  public next(tx: Transaction, val: A): void {
    const result = this.handleOuterNext(tx, val)
    if (result !== null) {
      result.clear && this.__clear()
      // run activations from new subscriptions
      const latest = this.outerTx
      this.outerTx = tx
      result.scheduler.run()
      if (this.initStage === true && this.sync === true && this.qHead === null) {
        // Case: Inner source is asynchronous EventStream (e.g. later), we must fake
        // no-initial event in order to satisfy Property contract
        this.__push(tx, { type: EventType.NO_INITIAL, next: null })
      }
      this.outerTx = latest
    }
  }

  public end(tx: Transaction): void {
    this.__resetOuterEnded(true)
    if (this.isInnerEnded()) {
      this.dispatcher.end(tx)
    } else {
      this.dispose()
    }
  }

  public pipedInitial(sender: Pipe<B>, tx: Transaction, val: B): void {
    this.__push(tx, {
      next: null,
      type: this.initStage ? EventType.INITIAL : EventType.EVENT,
      val,
    })
  }

  public pipedNoInitial(sender: Pipe<B>, tx: Transaction): void {
    this.initStage && this.__push(tx, { type: EventType.NO_INITIAL, next: null })
  }

  public pipedNext(sender: Pipe<B>, tx: Transaction, val: B): void {
    this.__push(tx, { type: EventType.EVENT, val, next: null })
  }

  public pipedError(sender: Pipe<B>, tx: Transaction, err: Error): void {
    this.__push(tx, { type: EventType.ERROR, err, next: null })
  }

  public pipedEnd(sender: Pipe<B>, tx: Transaction): void {
    this.__push(tx, { type: EventType.END, next: null, pipe: sender })
  }

  public continueJoin(tx: Transaction): void {
    const { dispatcher } = this
    let head = this.qHead
    this.qHead = this.qTail = null
    while (head !== null && dispatcher.isActive()) {
      switch (head.type) {
        case EventType.INITIAL:
          sendInitialSafely(tx, dispatcher, (head.val as any) as B)
          break
        case EventType.NO_INITIAL:
          sendNoInitialSafely(tx, dispatcher)
          break
        case EventType.EVENT:
          sendNextSafely(tx, dispatcher, (head.val as any) as B)
          break
        case EventType.ERROR:
          sendErrorSafely(tx, dispatcher, (head.err as any) as Error)
          break
        case EventType.END:
          this.__handleEnd(tx, head.pipe as any)
          break
      }
      head = head.next
    }
  }

  protected abstract isInnerEnded(): boolean

  protected abstract handleOuterNext(tx: Transaction, val: A): HandleOuterNextResult | null

  protected abstract handleInnerReorder(order: number): void

  protected abstract handleInnerEnd(sender: Pipe<B>): HandleInnerEndResult

  protected abstract handleInnerDispose(): void

  protected handleDispose(): void {
    this.__resetOuterEnded(false)
    this.__clear()
    this.handleInnerDispose()
    this.dispose()
  }

  protected handleReorder(order: number): void {
    this.handleInnerReorder(order)
    this.reorder(order)
  }

  private __push(tx: Transaction, qe: QueuedEvent<B>): void {
    this.qTail === null ? (this.qHead = this.qTail = qe) : (this.qTail = this.qTail.next = qe)
    this.queueJoin(this.outerTx || tx)
  }

  private __clear(): void {
    this.qHead = this.qTail = null
  }

  private __handleEnd(tx: Transaction, sender: Pipe<B>): void {
    const { ended, scheduler } = this.handleInnerEnd(sender)
    if (ended && this.outerEnded) {
      sendEndSafely(tx, this.dispatcher)
    } else if (scheduler !== null) {
      scheduler.run()
    }
  }

  private __resetOuterEnded(ended: boolean): void {
    // tslint:disable-next-line:semicolon whitespace
    ;(this.outerEnded as boolean) = ended
  }
}

enum IStatus {
  INITIAL = 0,
  RUNNING,
  ENDED,
}

class FlatMapLatest<A, B> extends FlatMapBase<A, B> {
  protected isubs: Subscription = NOOP_SUBSCRIPTION
  protected istat: number = IStatus.INITIAL

  protected isInnerEnded(): boolean {
    return this.istat !== IStatus.RUNNING
  }

  protected handleOuterNext(tx: Transaction, val: A): HandleOuterNextResult | null {
    return this._handleOuterNext(tx, val)
  }

  protected handleInnerReorder(order: number): void {
    this.isubs.reorder(order + 1)
  }

  protected handleInnerEnd(sender: Pipe<B>): HandleInnerEndResult {
    this.handleInnerDispose()
    this.istat = IStatus.ENDED
    return { ended: true, scheduler: null }
  }

  protected handleInnerDispose(): void {
    const isRunning = this.istat === IStatus.RUNNING
    this.istat = IStatus.INITIAL
    if (isRunning) {
      const isubs = this.isubs
      this.isubs = NOOP_SUBSCRIPTION
      isubs.dispose()
    }
  }
  protected _handleOuterNext(tx: Transaction, val: A): HandleOuterNextResult | null {
    const project = this.proj
    const prevSubs = this.isubs
    const innerObs = toObservable<B, Observable<B>>(project(val))
    const innerSource = innerObs.op
    const scheduler = getInnerScheduler()
    this.isubs = innerSource.subscribe(scheduler, new Pipe(this), this.order + 1)
    this.istat = IStatus.RUNNING
    prevSubs.dispose()
    return { scheduler, clear: true }
  }
}

class FlatMapFirst<A, B> extends FlatMapLatest<A, B> {
  protected handleOuterNext(tx: Transaction, val: A): HandleOuterNextResult | null {
    if (this.istat !== IStatus.RUNNING) {
      return this._handleOuterNext(tx, val)
    } else {
      return null
    }
  }
}

class InnerPipe<T> extends Pipe<T> {
  public n: InnerPipe<T> | null = null
  public p: InnerPipe<T> | null = null
  public subs: Subscription = NOOP_SUBSCRIPTION
  constructor(dest: PipeDest<T>, public src: Source<T>) {
    super(dest)
  }
}

class FlatMapConcurrent<A, B> extends FlatMapBase<A, B> {
  private nInner: number = 0
  private tail: InnerPipe<B> | null = null
  private head: InnerPipe<B> | null = null

  constructor(source: Source<A>, proj: Projection<A, B | Observable<B>>, private limit: number) {
    super(source, proj)
  }

  protected isInnerEnded(): boolean {
    return this.nInner === 0
  }

  protected handleOuterNext(tx: Transaction, val: A): HandleOuterNextResult | null {
    const project = this.proj
    const innerObs = toObservable<B, Observable<B>>(project(val))
    const innerSource = innerObs.op
    const inner = new InnerPipe(this, innerSource)
    if (this.insert(inner) <= this.limit) {
      const scheduler = this.scheduleHead()
      return { scheduler, clear: false }
    } else {
      return null
    }
  }

  protected handleInnerReorder(order: number): void {
    let inner = this.tail
    while (inner !== null) {
      inner.subs.reorder(order)
      inner = inner.p
    }
  }

  protected handleInnerEnd(sender: Pipe<B>): HandleInnerEndResult {
    const inner = sender as InnerPipe<B>
    inner.p !== null && (inner.p.n = inner.n)
    inner.n !== null && (inner.n.p = inner.p)
    inner === this.tail && (this.tail = inner.p)
    const subs = inner.subs
    inner.subs = NOOP_SUBSCRIPTION
    inner.n = null
    subs.dispose()
    const n = --this.nInner
    if (this.head !== null) {
      const scheduler = this.scheduleHead()
      return { ended: false, scheduler }
    } else {
      return { ended: n === 0, scheduler: null }
    }
  }

  protected handleInnerDispose(): void {
    let inner = this.tail
    this.tail = this.head = null
    this.nInner = 0
    while (inner !== null) {
      const subs = inner.subs
      inner.subs = NOOP_SUBSCRIPTION
      inner.n = null
      subs.dispose()
      inner = inner.p
    }
  }

  private insert(inner: InnerPipe<B>): number {
    if (this.tail === null) {
      this.tail = inner
    } else {
      inner.p = this.tail
      this.tail = this.tail.n = inner
    }
    this.head === null && (this.head = this.tail)
    return ++this.nInner
  }

  private scheduleHead(): Scheduler {
    const scheduler = getInnerScheduler()
    const inner = this.head as InnerPipe<B>
    this.head = inner.n
    inner.subs = inner.src.subscribe(scheduler, inner, this.order + 1)
    return scheduler
  }
}

interface HandleOuterNextResult {
  scheduler: Scheduler
  clear: boolean
}

interface HandleInnerEndResult {
  ended: boolean
  scheduler: Scheduler | null
}

interface QueuedEvent<T> {
  type: EventType
  val?: T
  err?: Error
  pipe?: Pipe<T>
  next: QueuedEvent<T> | null
}
