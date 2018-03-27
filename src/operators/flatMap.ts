import {
  NOOP_SUBSCRIPTION,
  sendEndSafely,
  sendErrorSafely,
  sendEventSafely,
  sendInitialSafely,
  sendNoInitialSafely,
  Source,
  Subscription,
  txPop,
  txPush,
} from "../_core"
import { Projection } from "../_interfaces"
import { Transaction } from "../_tx"
import { EventStream } from "../EventStream"
import { Observable } from "../Observable"
import { isProperty, Property } from "../Property"
import { currentScheduler, OnTimeout, Scheduler, Task, Timeout } from "../scheduler/index"
import { EventType } from "./_base"
import { JoinOperator } from "./_join"
import { Pipe, PipeDest } from "./_pipe"

export function flatMapLatest<A, B>(
  project: Projection<A, Observable<B>>,
  stream: EventStream<A>,
): EventStream<B>
export function flatMapLatest<A, B>(
  project: Projection<A, Observable<B>>,
  property: Property<A>,
): Property<B>
export function flatMapLatest<A, B>(
  project: Projection<A, Observable<B>>,
  observable: Observable<A>,
): Observable<B> {
  return _flatMapLatest(project, observable)
}

export function _flatMapLatest<A, B>(
  project: Projection<A, Observable<B>>,
  observable: Observable<A>,
): Observable<B> {
  const op = observable.op
  return isProperty(observable)
    ? new Property(new FlatMapLatest(op, true, project))
    : new EventStream(new FlatMapLatest(op, false, project))
}

class FlatMapLatest<A, B> extends JoinOperator<A, B, null> implements PipeDest<B> {
  private initStage: boolean = false
  private innerSubs: Subscription = NOOP_SUBSCRIPTION
  private innerEnded: boolean = false
  private outerEnded: boolean = false
  private qHead: QueuedEvent<B> | null = null
  private qTail: QueuedEvent<B> | null = null
  private outerTx: Transaction | null = null

  constructor(
    source: Source<A>,
    sync: boolean,
    private readonly proj: Projection<A, Observable<B>>,
  ) {
    super(source, sync)
  }

  public initial(tx: Transaction, val: A): void {
    this.initStage = true
    this.event(tx, val)
    this.initStage = false
  }

  public event(tx: Transaction, val: A): void {
    const project = this.proj
    const innerSubscription = this.innerSubs
    // TODO: ensure that innerObs is observable
    const innerObs = project(val)
    const innerSource = innerObs.op

    // TODO: custom scheduler
    const scheduler = new InnerSubscriptionScheduler(currentScheduler())
    this.innerSubs = innerSource.subscribe(scheduler, new Pipe(this), this.order + 1)
    this.innerEnded = false
    if (!isProperty(innerObs) && this.sync) {
      // EventStreams won't provide any initial events so we must fake it
      this.qHead = this.qTail = { type: EventType.NO_INITIAL, next: null }
    } else {
      this.qHead = this.qTail = null
    }

    // dispose previous subscriptions
    innerSubscription.dispose()
    // run activations from new subscriptions
    this.outerTx = tx
    txPush()
    scheduler.run()
    txPop()
    this.outerTx = null
  }

  public end(tx: Transaction): void {
    this.outerEnded = true
    if (this.innerEnded) {
      this.next.end(tx)
    } else {
      this.dispose()
    }
  }

  public pipedInitial(sender: Pipe<B>, tx: Transaction, val: B): void {
    this.pushQ(tx, { type: this.initStage ? EventType.INITIAL : EventType.EVENT, val, next: null })
  }

  public pipedNoInitial(sender: Pipe<B>, tx: Transaction): void {
    this.initStage && this.pushQ(tx, { type: EventType.NO_INITIAL, next: null })
  }

  public pipedEvent(sender: Pipe<B>, tx: Transaction, val: B): void {
    this.pushQ(tx, { type: EventType.EVENT, val, next: null })
  }

  public pipedError(sender: Pipe<B>, tx: Transaction, err: Error): void {
    this.pushQ(tx, { type: EventType.ERROR, err, next: null })
  }

  public pipedEnd(sender: Pipe<B>, tx: Transaction): void {
    this.pushQ(tx, { type: EventType.END, next: null })
  }

  public continueJoin(tx: Transaction, param: null): void {
    let head = this.qHead
    this.qHead = this.qTail = null
    while (head !== null && this.isActive()) {
      switch (head.type) {
        case EventType.INITIAL:
          sendInitialSafely(tx, this.next, (head.val as any) as B)
          break
        case EventType.NO_INITIAL:
          sendNoInitialSafely(tx, this.next)
          break
        case EventType.EVENT:
          sendEventSafely(tx, this.next, (head.val as any) as B)
          break
        case EventType.ERROR:
          sendErrorSafely(tx, this.next, (head.err as any) as Error)
          break
        case EventType.END:
          this.handleInnerEnd(tx)
          break
      }
      head = head.next
    }
  }

  protected handleDispose(): void {
    this.innerEnded = this.outerEnded = true
    this.qHead = this.qTail = null
    this.innerSubs.dispose()
    this.innerSubs = NOOP_SUBSCRIPTION
    this.dispose()
  }

  protected handleReorder(order: number): void {
    this.innerSubs.reorder(order + 1)
    this.propagateReorder(order)
  }

  private pushQ(tx: Transaction, qe: QueuedEvent<B>): void {
    this.qTail === null ? (this.qHead = this.qTail = qe) : (this.qTail = this.qTail.next = qe)
    this.queueJoin(this.outerTx || tx, null)
  }

  private handleInnerEnd(tx: Transaction): void {
    this.innerEnded = true
    if (this.outerEnded) {
      sendEndSafely(tx, this.next)
    } else {
      this.innerSubs.dispose()
      this.innerSubs = NOOP_SUBSCRIPTION
    }
  }
}

interface QueuedEvent<T> {
  type: EventType
  val?: T
  err?: Error
  next: QueuedEvent<T> | null
}

class InnerSubscriptionScheduler implements Scheduler {
  private impl: Scheduler
  constructor(private delegate: Scheduler) {
    this.impl = delegate.newInstance()
  }

  public newInstance(): Scheduler {
    return new InnerSubscriptionScheduler(this)
  }

  public schedulePropertyActivation(task: Task): void {
    this.impl.schedulePropertyActivation(task)
  }

  public scheduleEventStreamActivation(task: Task): void {
    this.impl.schedulePropertyActivation(task)
  }

  public scheduleTimeout(onTimeout: OnTimeout, delay: number): Timeout {
    return this.delegate.scheduleTimeout(onTimeout, delay)
  }

  public run(): void {
    this.impl.run()
  }

  public hasPendingTasks(): boolean {
    return this.impl.hasPendingTasks() || this.delegate.hasPendingTasks()
  }
}
