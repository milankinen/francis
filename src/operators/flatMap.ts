import { checkFunction, checkPositiveInt } from "../_check"
import { NOOP_SUBSCRIPTION, sendEnd, Source, Subscription } from "../_core"
import { Projection } from "../_interfaces"
import { toObs } from "../_interrop"
import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { curry2, curry3 } from "../_util"
import { Observable } from "../Observable"
import { stepIn, stepOut } from "../scheduler/index"
import { Pipe, PipeSubscriber } from "./_base"
import { JoinOperator } from "./_join"

export type ToFlatten<T> = T | Observable<T>

export interface FlatMapLatestOp {
  <A, B>(project: Projection<A, ToFlatten<B>>, observable: Observable<A>): Observable<B>
  <A, B>(project: Projection<A, ToFlatten<B>>): (observable: Observable<A>) => Observable<B>
}

export interface FlatMapFirstOp {
  <A, B>(project: Projection<A, ToFlatten<B>>, observable: Observable<A>): Observable<B>
  <A, B>(project: Projection<A, ToFlatten<B>>): (observable: Observable<A>) => Observable<B>
}

export interface FlatMapOp {
  <A, B>(project: Projection<A, ToFlatten<B>>, observable: Observable<A>): Observable<B>
  <A, B>(project: Projection<A, ToFlatten<B>>): (observable: Observable<A>) => Observable<B>
}

export interface FlatMapConcatOp {
  <A, B>(project: Projection<A, ToFlatten<B>>, observable: Observable<A>): Observable<B>
  <A, B>(project: Projection<A, ToFlatten<B>>): (observable: Observable<A>) => Observable<B>
}

export interface FlatMapWithConcurrencyLimitOp {
  <A, B>(
    limit: number,
    project: Projection<A, ToFlatten<B>>,
    observable: Observable<A>,
  ): Observable<B>
  <A, B>(limit: number, project: Projection<A, ToFlatten<B>>): (
    observable: Observable<A>,
  ) => Observable<B>
  <A, B>(limit: number): (
    project: Projection<A, ToFlatten<B>>,
    observable: Observable<A>,
  ) => Observable<B>
  <A, B>(limit: number): (
    project: Projection<A, ToFlatten<B>>,
  ) => (observable: Observable<A>) => Observable<B>
}

export const flatMapLatest: FlatMapLatestOp = curry2(_flatMapLatest)
export const flatMapFirst: FlatMapFirstOp = curry2(_flatMapFirst)
export const flatMap: FlatMapOp = curry2(_flatMap)
export const flatMapConcat: FlatMapConcatOp = curry2(_flatMapConcat)
export const flatMapWithConcurrencyLimit: FlatMapWithConcurrencyLimitOp = curry3(
  _flatMapWithConcurrencyLimit,
)

function _flatMapLatest<A, B>(
  project: Projection<A, ToFlatten<B>>,
  observable: Observable<A>,
): Observable<B> {
  checkFunction(project)
  return makeObservable(observable, new FlatMapLatest(observable.src, project))
}

function _flatMapFirst<A, B>(
  project: Projection<A, B | Observable<B>>,
  observable: Observable<A>,
): Observable<B> {
  checkFunction(project)
  return makeObservable(observable, new FlatMapFirst(observable.src, project))
}

function _flatMapConcat<A, B>(
  project: Projection<A, B | Observable<B>>,
  observable: Observable<A>,
): Observable<B> {
  return _flatMapWithConcurrencyLimitNoCheck(1, project, observable as any)
}

function _flatMap<A, B>(
  project: Projection<A, B | Observable<B>>,
  observable: Observable<A>,
): Observable<B> {
  return _flatMapWithConcurrencyLimitNoCheck(Infinity, project, observable as any)
}

function _flatMapWithConcurrencyLimit<A, B>(
  limit: number,
  project: Projection<A, B | Observable<B>>,
  observable: Observable<A>,
): Observable<B> {
  checkPositiveInt(limit)
  checkFunction(project)
  return _flatMapWithConcurrencyLimitNoCheck(limit, project, observable)
}

function _flatMapWithConcurrencyLimitNoCheck<A, B>(
  limit: number,
  project: Projection<A, B | Observable<B>>,
  observable: Observable<A>,
): Observable<B> {
  return makeObservable(observable, new FlatMapConcurrent(observable.src, project, limit))
}

abstract class FlatMapBase<A, B> extends JoinOperator<A, B> implements PipeSubscriber<B> {
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
      sendEnd(tx, this.sink)
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
  const initialNeeded = true
  subscription.activate(initialNeeded)
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
    const inner = toObs<B, Observable<B>>(proj(val))
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
  private itail: InnerPipe<A, B> | null = null
  private ihead: InnerPipe<A, B> | null = null
  private ni: number = 0

  constructor(source: Source<A>, proj: Projection<A, B | Observable<B>>, private limit: number) {
    super(source, proj)
  }

  protected isInnerEnded(): boolean {
    return this.ni === 0
  }

  protected outerNext(tx: Transaction, val: A): HandleOuterNextResult | null {
    if (this.append(new InnerPipe(this, val)) <= this.limit) {
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
    const inner = pipe as InnerPipe<A, B>
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

  private append(inner: InnerPipe<A, B>): number {
    if (this.itail === null) {
      this.itail = inner
    } else {
      this.itail = this.itail.t = inner
    }
    this.ihead === null && (this.ihead = this.itail)
    return ++this.ni
  }

  private subscribeHead(): Subscription {
    const { proj } = this
    const inner = this.ihead as InnerPipe<A, B>
    this.ihead = inner.t
    const iobs = toObs<B, Observable<B>>(proj(inner.v))
    inner.subs = iobs.src.subscribe(inner, this.ord + 1)
    return inner.subs
  }
}

class InnerPipe<A, B> extends Pipe<B> {
  public t: InnerPipe<A, B> | null = null
  public subs: Subscription = NOOP_SUBSCRIPTION
  constructor(dest: PipeSubscriber<B>, public v: A) {
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
