import {
  NONE,
  NOOP_SUBSCRIPTION,
  sendEndSafely,
  sendErrorSafely,
  sendInitialSafely,
  sendNextSafely,
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
import { EventType } from "./_base"
import { JoinOperator } from "./_join"
import { Pipe, PipeDest } from "./_pipe"

export function sampleWith<S, V, R>(
  sampler: Property<S>,
  project: (value: V, sample: S) => R,
  value: Property<V>,
): Property<R>
export function sampleWith<S, V, R>(
  sampler: EventStream<S>,
  project: (value: V, sample: S) => R,
  value: Property<V>,
): EventStream<R>
export function sampleWith<S, V, R>(
  sampler: Observable<S>,
  project: (value: V, sample: S) => R,
  value: Property<V>,
): Observable<R>
export function sampleWith<S, V, R>(
  sampler: Observable<S>,
  project: (value: V, sample: S) => R,
  value: Property<V>,
): Observable<R> {
  return _sampleF(sampler, project, value)
}

export function sampleBy<S, V>(sampler: Property<S>, value: Property<V>): Property<V>
export function sampleBy<S, V>(sampler: EventStream<S>, value: Property<V>): EventStream<V>
export function sampleBy<S, V>(sampler: Observable<S>, value: Property<V>): Observable<V>
export function sampleBy<S, V>(sampler: Observable<S>, value: Property<V>): Observable<V> {
  return _sampleF(sampler, (v: V, s: S) => v, value)
}

function _sampleF<S, V, R>(
  sampler: Observable<S>,
  project: (value: V, sample: S) => R,
  value: Property<V>,
): Observable<R> {
  const cs = new SVSource(value.op, sampler.op, new Pipe(null as any))
  return makeObservable(new Sample(cs, project))
}

class Sample<S, V, R> extends JoinOperator<S, R, null> implements PipeDest<V> {
  private type: EventType.INITIAL | EventType.NEXT = EventType.NEXT
  private sample: S = NONE
  private val: V = NONE

  constructor(source: SVSource<S, V>, private p: (value: V, sample: S) => R) {
    super(source, source.sync)
    source.vDest = new Pipe(this)
  }

  public initial(tx: Transaction, sample: S): void {
    this.sample = sample
    this.type = EventType.INITIAL
    this.fork(tx)
  }

  public next(tx: Transaction, sample: S): void {
    this.sample = sample
    this.type = EventType.NEXT
    this.fork(tx)
  }

  public error(tx: Transaction, err: Error): void {
    this.forkError(tx, err)
  }

  public end(tx: Transaction): void {
    this.forkEnd(tx)
  }

  public pipedInitial(sender: Pipe<V>, tx: Transaction, val: V): void {
    this.val = val
  }

  public pipedNoInitial(sender: Pipe<V>, tx: Transaction): void {
    this.sync && this.dispatcher.noinitial(tx)
  }

  public pipedNext(sender: Pipe<V>, tx: Transaction, val: V): void {
    this.val = val
  }

  public pipedError(sender: Pipe<V>, tx: Transaction, err: Error): void {
    this.forkError(tx, err)
  }

  public pipedEnd(sender: Pipe<V>, tx: Transaction): void {
    const svs = this.source as SVSource<S, V>
    svs.disposeValue()
  }

  public join(tx: Transaction): void {
    const { val, sample } = this
    if (val !== NONE && sample !== NONE) {
      const project = this.p
      const result = project(this.val, this.sample)
      const send = this.type === EventType.INITIAL ? sendInitialSafely : sendNextSafely
      this.sample = NONE
      send(tx, this.dispatcher, result)
    } else {
      this.sample = NONE
    }
    super.join(tx)
  }

  public joinError(tx: Transaction, err: Error): void {
    sendErrorSafely(tx, this.dispatcher, err)
  }

  public joinEnd(tx: Transaction): void {
    sendEndSafely(tx, this.dispatcher)
  }
}

class SVSource<S, V> implements Source<S>, Subscription {
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
