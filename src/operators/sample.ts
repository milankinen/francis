import {
  NONE,
  NOOP_SUBSCRIPTION,
  sendEventSafely,
  sendInitialSafely,
  Source,
  Subscriber,
  Subscription,
} from "../_core"
import { Transaction } from "../_tx"
import { EventStream } from "../EventStream"
import { Observable } from "../Observable"
import { isProperty, Property } from "../Property"
import { Scheduler } from "../scheduler/index"
import { JoinOperator } from "./_join"
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
  const op = new Sample(project, value.op, sampler.op)
  return isProperty(sampler) ? new Property(op) : new EventStream(op)
}

class Sample<S, V, R> extends JoinOperator<S, R, boolean> implements PipeDest<V> {
  private sample: S
  private val: V

  constructor(private p: (value: V, sample: S) => R, valueSrc: Source<V>, sampleSrc: Source<S>) {
    super(new CompositeSource(valueSrc, sampleSrc, new Pipe(null as any)))
    this.val = this.sample = NONE
    const cs = this.source as CompositeSource<S, V>
    cs.vDest = new Pipe(this)
  }

  public initial(tx: Transaction, sample: S): void {
    this.sample = sample
    this.queueJoin(tx, true)
  }

  public event(tx: Transaction, sample: S): void {
    this.sample = sample
    this.queueJoin(tx, false)
  }

  public continueJoin(tx: Transaction, initial: boolean): void {
    if (this.val !== NONE) {
      const project = this.p
      const result = project(this.val, this.sample)
      initial ? sendInitialSafely(tx, this.next, result) : sendEventSafely(tx, this.next, result)
    }
  }

  public pipedInitial(sender: Pipe<V>, tx: Transaction, val: V): void {
    this.val = val
  }

  public pipedNoInitial(sender: Pipe<V>, tx: Transaction): void {}

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
}

class CompositeSource<S, V> implements Source<S>, Subscription {
  public weight: number
  private vSubs: Subscription
  private sSubs: Subscription
  constructor(public vSrc: Source<V>, public sSrc: Source<S>, public vDest: Subscriber<V>) {
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