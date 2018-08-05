import {
  NONE,
  NOOP_SUBSCRIBER,
  NOOP_SUBSCRIPTION,
  sendNext,
  Source,
  Subscriber,
  Subscription,
} from "../_core"
import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { curry2, curry3 } from "../_util"
import { Observable } from "../Observable"
import { Property } from "../Property"
import { Pipe, PipeSubscriber } from "./_base"
import { JoinOperator } from "./_join"

export interface SampleWithOp {
  <S, V, R>(
    sampler: Observable<S>,
    project: (value: V, sample: S) => R,
    value: Property<V>,
  ): Observable<R>
  <S, V, R>(sampler: Observable<S>): (
    project: (value: V, sample: S) => R,
    value: Property<V>,
  ) => Observable<R>
  <S, V, R>(sampler: Observable<S>, project: (value: V, sample: S) => R): (
    value: Property<V>,
  ) => Observable<R>
  <S, V, R>(sampler: Observable<S>): (
    project: (value: V, sample: S) => R,
  ) => (value: Property<V>) => Observable<R>
}

export interface SampleByOp {
  <S, V>(sampler: Observable<S>, value: Property<V>): Observable<V>
  <S, V>(sampler: Observable<S>): (value: Property<V>) => Observable<V>
}

export const sampleWith: SampleWithOp = curry3(_sampleWith)
export const sampleBy: SampleByOp = curry2(_sampleBy)

function _sampleWith<S, V, R>(
  sampler: Observable<S>,
  project: (value: V, sample: S) => R,
  value: Property<V>,
): Observable<R> {
  return _sampleF(sampler, project, value)
}

function _sampleBy<S, V>(sampler: Observable<S>, value: Property<V>): Observable<V> {
  return _sampleF(sampler, (v: V, s: S) => v, value)
}

function _sampleF<S, V, R>(
  sampler: Observable<S>,
  project: (value: V, sample: S) => R,
  value: Property<V>,
): Observable<R> {
  return makeObservable(sampler, new Sample(value.src, sampler.src, project))
}

class Sample<S, V, R> extends JoinOperator<S, R> implements PipeSubscriber<V> {
  protected source!: SVSource<S, V>
  private sample: S = NONE
  private val: V = NONE

  constructor(vSrc: Source<V>, sSrc: Source<S>, private p: (value: V, sample: S) => R) {
    super(new SVSource(vSrc, sSrc, NOOP_SUBSCRIBER))
    this.source.vDest = new Pipe(this)
  }

  public dispose(): void {
    this.sample = this.val = NONE
    super.dispose()
  }

  public next(tx: Transaction, sample: S): void {
    this.sample = sample
    this.fork(tx)
  }

  public error(tx: Transaction, err: Error): void {
    this.forkError(tx, err)
  }

  public end(tx: Transaction): void {
    this.forkEnd(tx)
  }

  public pipedNext(sender: Pipe<V>, tx: Transaction, val: V): void {
    this.val = val
  }

  public pipedError(sender: Pipe<V>, tx: Transaction, err: Error): void {
    this.forkError(tx, err)
  }

  public pipedEnd(sender: Pipe<V>, tx: Transaction): void {
    this.source.disposeValue()
  }

  public join(tx: Transaction): void {
    const { val, sample } = this
    if (val !== NONE && sample !== NONE) {
      const project = this.p
      const result = project(this.val, this.sample)
      this.sample = NONE
      sendNext(tx, this.sink, result)
    } else {
      this.sample = NONE
    }
    super.join(tx)
  }
}

export class SVSource<S, V> implements Source<S>, Subscription {
  public readonly weight: number
  private vSubs: Subscription
  private sSubs: Subscription

  constructor(public vSrc: Source<V>, public sSrc: Source<S>, public vDest: Subscriber<V>) {
    this.weight = vSrc.weight + sSrc.weight
    this.vSubs = this.sSubs = NOOP_SUBSCRIPTION
  }

  public subscribe(subscriber: Subscriber<S>, order: number): Subscription {
    this.vSubs = this.vSrc.subscribe(this.vDest, order)
    this.sSubs = this.sSrc.subscribe(subscriber, order)
    return this
  }

  public activate(initialNeeded: boolean): void {
    this.vSubs.activate(initialNeeded)
    this.sSubs.activate(initialNeeded)
  }

  public reorder(order: number): void {
    this.vSubs.reorder(order)
    this.sSubs.reorder(order)
  }

  public dispose(): void {
    const { sSubs, vSubs } = this
    this.vSubs = this.sSubs = NOOP_SUBSCRIPTION
    sSubs.dispose()
    vSubs.dispose()
  }

  public disposeValue(): void {
    const { vSubs } = this
    this.vSubs = NOOP_SUBSCRIPTION
    vSubs.dispose()
  }
}
