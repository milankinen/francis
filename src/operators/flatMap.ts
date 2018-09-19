import { checkFunction, checkPositiveInt } from "../_check"
import { NOOP_SUBSCRIPTION, Source, Subscription } from "../_core"
import { Projection } from "../_interfaces"
import { toObs } from "../_interrop"
import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { curry2, curry3 } from "../_util"
import { dispatcherOf, Observable } from "../Observable"
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
  return makeObservable(observable, new FlatMapLatest(dispatcherOf(observable), project))
}

function _flatMapFirst<A, B>(
  project: Projection<A, B | Observable<B>>,
  observable: Observable<A>,
): Observable<B> {
  checkFunction(project)
  return makeObservable(observable, new FlatMapFirst(dispatcherOf(observable), project))
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
  return makeObservable(observable, new FlatMapConcurrent(dispatcherOf(observable), project, limit))
}

abstract class FlatMapBase<A, B> extends JoinOperator<A, B> implements PipeSubscriber<B> {
  protected outerEnded: boolean = false
  protected otx: Transaction | null = null

  constructor(source: Source<A>, protected readonly proj: Projection<A, B | Observable<B>>) {
    super(source)
  }

  public abstract next(tx: Transaction, val: A): void

  public abstract innerEnd(sender: Pipe<B>): boolean

  public abstract isInnerEnded(): boolean

  public abstract disposeInner(): void

  public abstract reorderInner(order: number): void

  public reorder(order: number): void {
    this.reorderInner(order)
    super.reorder(order)
  }

  public dispose(): void {
    this.outerEnded = false
    this.disposeInner()
    this.disposeOuter()
    super.dispose()
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

  protected inInnerCtx(f: any, tx: Transaction, args: any[]): void {
    const otx = this.otx
    this.otx = tx
    try {
      stepIn()
      f.apply(this, args)
    } finally {
      try {
        stepOut()
      } finally {
        this.otx = otx
      }
    }
  }

  protected joinCustom(tx: Transaction, sender: any): void {
    this.joinInnerEnd(tx, sender)
  }

  private joinInnerEnd(tx: Transaction, sender: Pipe<B>): void {
    const innerEnded = this.innerEnd(sender)
    if (innerEnded && this.outerEnded) {
      this.sink.end(tx)
    }
  }

  private disposeOuter(): void {
    const { subs } = this
    this.subs = NOOP_SUBSCRIPTION
    subs.dispose()
  }
}

// TODO: flatten to constants
enum IStatus {
  IDLE = 0,
  RUNNING = 1,
  ENDED = 2,
}

const { IDLE, RUNNING, ENDED } = IStatus

abstract class FlatMapSwitchable<A, B> extends FlatMapBase<A, B> {
  protected isubs: Subscription = NOOP_SUBSCRIPTION
  protected istat: IStatus = IDLE

  public abstract next(tx: Transaction, val: A): void

  public innerEnd(sender: Pipe<B>): boolean {
    this.disposeInner()
    this.istat = ENDED
    return true
  }

  public isInnerEnded(): boolean {
    return this.istat !== RUNNING
  }

  public reorderInner(order: number): void {
    this.isubs.reorder(order + 1)
  }

  public disposeInner(): void {
    const isRunning = this.istat === RUNNING
    this.istat = IDLE
    if (isRunning) {
      const { isubs } = this
      this.isubs = NOOP_SUBSCRIPTION
      isubs.dispose()
    }
  }

  protected switch(tx: Transaction, val: A): void {
    this.inInnerCtx(this.doSwitch, tx, [val])
  }

  private doSwitch(val: A): void {
    const { isubs, proj } = this
    const inner = toObs<B, Observable<B>>(proj(val))
    const innerSource = dispatcherOf(inner)
    const subscription = (this.isubs = innerSource.subscribe(new Pipe(this), this.ord + 1))
    this.istat = RUNNING
    isubs.dispose()
    this.abortJoin()
    subscription.activate(true)
  }
}

class FlatMapLatest<A, B> extends FlatMapSwitchable<A, B> {
  public next(tx: Transaction, val: A): void {
    this.switch(tx, val)
  }
}

class FlatMapFirst<A, B> extends FlatMapSwitchable<A, B> {
  public next(tx: Transaction, val: A): void {
    if (this.isInnerEnded()) {
      this.switch(tx, val)
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

  public next(tx: Transaction, val: A): void {
    if (this.append(new InnerPipe(this, val)) <= this.limit) {
      this.inInnerCtx(this.subscribeHead, tx, [])
    }
  }

  public innerEnd(pipe: Pipe<B>): boolean {
    const inner = pipe as InnerPipe<A, B>
    const n = --this.ni
    const subs = inner.subs
    inner.subs = NOOP_SUBSCRIPTION
    inner.t = null
    subs.dispose()
    if (this.ihead !== null) {
      this.inInnerCtx(this.subscribeHead, this.otx as Transaction, [])
      return false
    } else {
      return n === 0
    }
  }

  public isInnerEnded(): boolean {
    return this.ni === 0
  }

  public reorderInner(order: number): void {
    let inner = this.ihead
    while (inner !== null) {
      inner.subs.reorder(order)
      inner = inner.t
    }
  }

  public disposeInner(): void {
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

  private subscribeHead(): void {
    const { proj } = this
    const inner = this.ihead as InnerPipe<A, B>
    this.ihead = inner.t
    const iobs = toObs<B, Observable<B>>(proj(inner.v))
    inner.subs = dispatcherOf(iobs).subscribe(inner, this.ord + 1)
    inner.subs.activate(true)
  }
}

class InnerPipe<A, B> extends Pipe<B> {
  public t: InnerPipe<A, B> | null = null
  public subs: Subscription = NOOP_SUBSCRIPTION
  constructor(dest: PipeSubscriber<B>, public v: A) {
    super(dest)
  }
}
