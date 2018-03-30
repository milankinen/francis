import {
  NONE,
  NOOP_SUBSCRIPTION,
  sendEndSafely,
  sendErrorSafely,
  sendEventSafely,
  sendInitialSafely,
  Source,
  Subscriber,
  Subscription,
} from "../_core"
import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { EventStream } from "../EventStream"
import { Observable } from "../Observable"
import { Property } from "../Property"
import { Scheduler } from "../scheduler/index"
import { ErrorQueue, JoinOperator } from "./_join"
import { Pipe, PipeDest } from "./_pipe"

export function sampleByF<S, V, R>(
  sampler: Property<S>,
  project: (value: V, sample: S) => R,
  value: Property<V>,
): Property<R>
export function sampleByF<S, V, R>(
  sampler: EventStream<S>,
  project: (value: V, sample: S) => R,
  value: Property<V>,
): EventStream<R>
export function sampleByF<S, V, R>(
  sampler: Observable<S>,
  project: (value: V, sample: S) => R,
  value: Property<V>,
): Observable<R> {
  return _sampleByF(sampler, project, value)
}

export function sampleBy<S, V>(sampler: Property<S>, value: Property<V>): Property<V>
export function sampleBy<S, V>(sampler: EventStream<S>, value: Property<V>): EventStream<V>
export function sampleBy<S, V>(sampler: Observable<S>, value: Property<V>): Observable<V> {
  return _sampleByF(sampler, (v: V, s: S) => v, value)
}

export function _sampleByF<S, V, R>(
  sampler: Observable<S>,
  project: (value: V, sample: S) => R,
  value: Property<V>,
): Observable<R> {
  const cs = new CompositeSource(value.op, sampler.op, new Pipe(null as any))
  return makeObservable(new Sample(cs, project))
}

class Sample<S, V, R> extends JoinOperator<S, R, null> implements PipeDest<V> {
  private qErrs = new ErrorQueue()
  private qEnd: boolean = false
  private isInitial: boolean = false
  private sample: S = NONE
  private val: V = NONE

  constructor(source: CompositeSource<S, V>, private p: (value: V, sample: S) => R) {
    super(source, source.sync)
    source.vDest = new Pipe(this)
  }

  public initial(tx: Transaction, sample: S): void {
    this.sample = sample
    this.isInitial = true
    this.queueJoin(tx, null)
  }

  public event(tx: Transaction, sample: S): void {
    this.sample = sample
    this.isInitial = false
    this.queueJoin(tx, null)
  }

  public error(tx: Transaction, err: Error): void {
    this.qErrs.push(err)
    this.queueJoin(tx, null)
  }

  public end(tx: Transaction): void {
    this.qEnd = true
    this.queueJoin(tx, null)
  }

  public pipedInitial(sender: Pipe<V>, tx: Transaction, val: V): void {
    this.val = val
  }

  public pipedNoInitial(sender: Pipe<V>, tx: Transaction): void {
    this.sync && this.next.noinitial(tx)
  }

  public pipedEvent(sender: Pipe<V>, tx: Transaction, val: V): void {
    this.val = val
  }

  public pipedError(sender: Pipe<V>, tx: Transaction, err: Error): void {
    this.error(tx, err)
  }

  public pipedEnd(sender: Pipe<V>, tx: Transaction): void {
    const cs = this.source as CompositeSource<S, V>
    cs.disposeValue()
  }

  public continueJoin(tx: Transaction, _: null): void {
    const { val, sample } = this
    if (val !== NONE && sample !== NONE) {
      const project = this.p
      const result = project(this.val, this.sample)
      this.sample = NONE
      this.isActive() &&
        (this.isInitial
          ? sendInitialSafely(tx, this.next, result)
          : sendEventSafely(tx, this.next, result))
    } else {
      this.sample = NONE
    }
    if (this.qErrs.hasErrors()) {
      const errs = this.qErrs.popAll()
      for (let i = 0; this.isActive() && i < errs.length; i++) {
        sendErrorSafely(tx, this.next, errs[i])
      }
    }
    if (this.qEnd) {
      this.qEnd = false
      this.isActive() && sendEndSafely(tx, this.next)
    }
  }
}

class CompositeSource<S, V> implements Source<S>, Subscription {
  public readonly weight: number
  public readonly sync: boolean
  private vSubs: Subscription
  private sSubs: Subscription
  constructor(public vSrc: Source<V>, public sSrc: Source<S>, public vDest: Subscriber<V>) {
    this.sync = this.sSrc.sync
    this.weight = vSrc.weight + sSrc.weight
    this.vSubs = this.sSubs = NOOP_SUBSCRIPTION
  }

  public subscribe(scheduler: Scheduler, subscriber: Subscriber<S>, order: number): Subscription {
    this.vSubs = this.vSrc.subscribe(scheduler, this.vDest, order)
    this.sSubs = this.sSrc.subscribe(scheduler, subscriber, order)
    return this
  }

  public reorder(order: number): void {
    this.vSubs.reorder(order)
    this.sSubs.reorder(order)
  }

  public dispose(): void {
    this.sSubs.dispose()
    this.vSubs.dispose()
    this.vSubs = this.sSubs = NOOP_SUBSCRIPTION
  }

  public disposeValue(): void {
    this.vSubs.dispose()
    this.vSubs = NOOP_SUBSCRIPTION
  }
}
