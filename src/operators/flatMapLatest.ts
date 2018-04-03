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
import { getInnerScheduler } from "../scheduler/index"
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

class FlatMapLatest<A, B> extends JoinOperator<A, B> implements PipeDest<B> {
  private initStage: boolean = false
  private innerSubs: Subscription = NOOP_SUBSCRIPTION
  private innerEnded: boolean = false
  private outerEnded: boolean = false
  private qHead: QueuedEvent<B> | null = null
  private qTail: QueuedEvent<B> | null = null
  private outerTx: Transaction | null = null

  constructor(source: Source<A>, private readonly proj: Projection<A, B | Observable<B>>) {
    super(source, source.sync)
  }

  public initial(tx: Transaction, val: A): void {
    this.initStage = true
    this.next(tx, val)
    this.initStage = false
  }

  public next(tx: Transaction, val: A): void {
    const project = this.proj
    const innerSubscription = this.innerSubs
    const innerObs = toObservable(project(val))
    const innerSource = innerObs.op
    const scheduler = getInnerScheduler()
    this.innerSubs = innerSource.subscribe(scheduler, new Pipe(this), this.order + 1)
    this.innerEnded = false
    if (!innerSource.sync && this.sync) {
      // EventStreams won't provide any initial events so we must fake it
      this.qHead = this.qTail = { type: EventType.NO_INITIAL, next: null }
    } else {
      this.qHead = this.qTail = null
    }

    // dispose previous subscriptions
    innerSubscription.dispose()
    // run activations from new subscriptions
    this.outerTx = tx
    scheduler.run()
    this.outerTx = null
  }

  public end(tx: Transaction): void {
    this.outerEnded = true
    if (this.innerEnded) {
      this.dispatcher.end(tx)
    } else {
      this.dispose()
    }
  }

  public pipedInitial(sender: Pipe<B>, tx: Transaction, val: B): void {
    this.pushInnerEvent(tx, {
      next: null,
      type: this.initStage ? EventType.INITIAL : EventType.EVENT,
      val,
    })
  }

  public pipedNoInitial(sender: Pipe<B>, tx: Transaction): void {
    this.initStage && this.pushInnerEvent(tx, { type: EventType.NO_INITIAL, next: null })
  }

  public pipedNext(sender: Pipe<B>, tx: Transaction, val: B): void {
    this.pushInnerEvent(tx, { type: EventType.EVENT, val, next: null })
  }

  public pipedError(sender: Pipe<B>, tx: Transaction, err: Error): void {
    this.pushInnerEvent(tx, { type: EventType.ERROR, err, next: null })
  }

  public pipedEnd(sender: Pipe<B>, tx: Transaction): void {
    this.pushInnerEvent(tx, { type: EventType.END, next: null })
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
          this.handleInnerEnd(tx)
          break
      }
      head = head.next
    }
  }

  protected handleDispose(): void {
    const isubs = this.innerSubs
    this.innerEnded = this.outerEnded = true
    this.qHead = this.qTail = null
    this.innerSubs = NOOP_SUBSCRIPTION
    isubs.dispose()
    this.dispose()
  }

  protected handleReorder(order: number): void {
    this.innerSubs.reorder(order + 1)
    this.reorder(order)
  }

  private pushInnerEvent(tx: Transaction, qe: QueuedEvent<B>): void {
    this.qTail === null ? (this.qHead = this.qTail = qe) : (this.qTail = this.qTail.next = qe)
    this.queueJoin(this.outerTx || tx)
  }

  private handleInnerEnd(tx: Transaction): void {
    this.innerEnded = true
    if (this.outerEnded) {
      sendEndSafely(tx, this.dispatcher)
    } else {
      const isubs = this.innerSubs
      this.innerSubs = NOOP_SUBSCRIPTION
      isubs.dispose()
    }
  }
}

interface QueuedEvent<T> {
  type: EventType
  val?: T
  err?: Error
  next: QueuedEvent<T> | null
}
