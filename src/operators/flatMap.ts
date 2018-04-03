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

abstract class FlatMapBase<A, B> extends JoinOperator<A, B> implements PipeDest<B> {
  protected readonly outerEnded: boolean = false
  private initStage: boolean = false
  private qHead: QueuedEvent<B> | null = null
  private qTail: QueuedEvent<B> | null = null
  private outerTx: Transaction | null = null

  constructor(source: Source<A>, protected readonly proj: Projection<A, B | Observable<B>>) {
    super(source, source.sync)
  }

  public initial(tx: Transaction, val: A): void {
    this.initStage = true
    this.next(tx, val)
    this.initStage = false
  }

  public next(tx: Transaction, val: A): void {
    const result = this.handleOuterNext(tx, val)
    if (result !== null) {
      this.__reset(result.innerSync)
      // run activations from new subscriptions
      this.outerTx = tx
      result.scheduler.run()
      this.outerTx = null
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

  protected abstract handleInnerEnd(sender: Pipe<B>): boolean

  protected abstract handleInnerDispose(): void

  protected handleDispose(): void {
    this.__resetOuterEnded(false)
    this.__reset(false)
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

  private __reset(innerSync: boolean): void {
    if (this.initStage && !innerSync && this.sync) {
      // EventStreams won't provide any initial events so we must fake it
      this.qHead = this.qTail = { type: EventType.NO_INITIAL, next: null }
    } else {
      this.qHead = this.qTail = null
    }
  }

  private __handleEnd(tx: Transaction, sender: Pipe<B>): void {
    const innerEnded = this.handleInnerEnd(sender)
    if (innerEnded && this.outerEnded) {
      sendEndSafely(tx, this.dispatcher)
    }
  }

  private __resetOuterEnded(ended: boolean): void {
    // tslint:disable-next-line:semicolon whitespace
    ;(this.outerEnded as boolean) = true
  }
}

class FlatMapLatest<A, B> extends FlatMapBase<A, B> {
  private isubs: Subscription = NOOP_SUBSCRIPTION
  private iend: boolean = false

  protected isInnerEnded(): boolean {
    return this.iend
  }

  protected handleOuterNext(tx: Transaction, val: A): HandleOuterNextResult | null {
    const project = this.proj
    const prevSubs = this.isubs
    const innerObs = toObservable<B, Observable<B>>(project(val))
    const innerSource = innerObs.op
    const scheduler = getInnerScheduler()
    this.isubs = innerSource.subscribe(scheduler, new Pipe(this), this.order + 1)
    this.iend = false
    prevSubs.dispose()
    return { scheduler, innerSync: innerSource.sync }
  }

  protected handleInnerReorder(order: number): void {
    this.isubs.reorder(order + 1)
  }

  protected handleInnerEnd(sender: Pipe<B>): boolean {
    this.handleInnerDispose()
    return (this.iend = true)
  }

  protected handleInnerDispose(): void {
    if (this.iend) {
      this.iend = false
    } else {
      const isubs = this.isubs
      this.isubs = NOOP_SUBSCRIPTION
      isubs.dispose()
    }
  }
}

class FlatMapFirst<A, B> extends FlatMapBase<A, B> {
  private isubs: Subscription = NOOP_SUBSCRIPTION
  private iend: boolean = true

  protected isInnerEnded(): boolean {
    return this.iend
  }

  protected handleOuterNext(tx: Transaction, val: A): HandleOuterNextResult | null {
    if (this.iend) {
      const project = this.proj
      const innerObs = toObservable<B, Observable<B>>(project(val))
      const innerSource = innerObs.op
      const scheduler = getInnerScheduler()
      this.isubs = innerSource.subscribe(scheduler, new Pipe(this), this.order + 1)
      this.iend = false
      return { scheduler, innerSync: innerSource.sync }
    } else {
      return null
    }
  }

  protected handleInnerReorder(order: number): void {
    this.isubs.reorder(order + 1)
  }

  protected handleInnerEnd(sender: Pipe<B>): boolean {
    this.handleInnerDispose()
    return true
  }

  protected handleInnerDispose(): void {
    if (!this.iend) {
      const isubs = this.isubs
      this.isubs = NOOP_SUBSCRIPTION
      this.iend = true
      isubs.dispose()
    }
  }
}

interface HandleOuterNextResult {
  scheduler: Scheduler
  innerSync: boolean
}

interface QueuedEvent<T> {
  type: EventType
  val?: T
  err?: Error
  pipe?: Pipe<T>
  next: QueuedEvent<T> | null
}
