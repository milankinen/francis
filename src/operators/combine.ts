import { __DEVBUILD__, assert } from "../_assert"
import { NONE, sendInitialSafely, sendNextSafely, Subscriber, Subscription } from "../_core"
import { toObservable } from "../_interrop"
import { makeProperty } from "../_obs"
import { Transaction } from "../_tx"
import { isArray } from "../_util"
import { Observable } from "../Observable"
import { Property } from "../Property"
import { Scheduler } from "../scheduler/index"
import { constant } from "../sources/constant"
import { EventType, SendNoInitialTask } from "./_base"
import { Indexed, IndexedEndSubscriber, IndexedSource } from "./_indexed"
import { JoinOperator } from "./_join"
import { map } from "./map"
import { toProperty } from "./toProperty"

export function combineAsArray<T>(observables?: Array<Observable<T> | T>): Property<T[]>
export function combineAsArray<A>(o1: Observable<A> | A): Property<[A]>
export function combineAsArray<A, B>(o1: Observable<A> | A, o2: Observable<B> | B): Property<[A, B]>
export function combineAsArray<A, B, C>(
  o1: Observable<A> | A,
  o2: Observable<B> | B,
  o3: Observable<C> | C,
): Property<[A, B, C]>
export function combineAsArray<A, B, C, D>(
  o1: Observable<A> | A,
  o2: Observable<B> | B,
  o3: Observable<C> | C,
  o4: Observable<D> | D,
): Property<[A, B, C, D]>
export function combineAsArray<A, B, C, D, E>(
  o1: Observable<A> | A,
  o2: Observable<B> | B,
  o3: Observable<C> | C,
  o4: Observable<D> | D,
  o5: Observable<E> | E,
): Property<[A, B, C, D, E]>
export function combineAsArray<A, B, C, D, E, F>(
  o1: Observable<A> | A,
  o2: Observable<B> | B,
  o3: Observable<C> | C,
  o4: Observable<D> | D,
  o5: Observable<E> | E,
  o6: Observable<F> | F,
): Property<[A, B, C, D, E, F]>
export function combineAsArray(...observables: Array<Observable<any>>): Property<any[]>
export function combineAsArray<T>(...observables: any[]): Property<T[]> {
  if (observables.length === 0) {
    return _combine<T, T[]>(slice, [])
  } else if (isArray(observables[0])) {
    if (__DEVBUILD__) {
      assert(observables.length === 1, "Nested arrays are not supported by combine")
    }
    return _combine<T, T[]>(slice, observables[0])
  } else {
    return _combine<T, T[]>(slice, observables)
  }
}

export function _combine<A, B>(
  f: (vals: A[]) => B,
  observables: Array<Observable<A> | A>,
): Property<B> {
  let n = observables.length
  if (n === 0) {
    return map(f, constant([] as A[]))
  } else if (n === 1) {
    return toProperty(map(val => f([val]), toObservable<A, Observable<A>>(observables[0])))
  } else {
    const sources = Array(n)
    while (n--) {
      sources[n] = toObservable(observables[n]).op
    }
    return makeProperty(new Combine<A, B>(new IndexedSource(sources), f))
  }
}

class Combine<A, B> extends JoinOperator<Indexed<A>, B, null> implements IndexedEndSubscriber {
  private has: EventType.INITIAL | EventType.NEXT | 0 = 0
  private vals: A[]
  private nValWait!: number
  private nInitWait!: number
  private nEndWait!: number

  constructor(source: IndexedSource<A>, private f: (vals: A[]) => B) {
    super(source, true)
    source.setEndSubscriber(this)
    this.vals = Array(source.size())
    this.resetState()
  }

  public initial(tx: Transaction, ival: Indexed<A>): void {
    const prev = this.vals[ival.idx]
    this.vals[ival.idx] = ival.val
    --this.nInitWait
    if ((prev === NONE && --this.nValWait === 0) || this.nValWait === 0) {
      this.has = EventType.INITIAL
      this.fork(tx)
    } else if (this.nInitWait === 0) {
      this.dispatcher.noinitial(tx)
    }
  }

  public noinitial(tx: Transaction): void {
    if (--this.nInitWait === 0) {
      this.dispatcher.noinitial(tx)
    }
  }

  public next(tx: Transaction, ival: Indexed<A>): void {
    const prev = this.vals[ival.idx]
    this.vals[ival.idx] = ival.val
    if ((prev === NONE && --this.nValWait === 0) || this.nValWait === 0) {
      this.has = EventType.NEXT
      this.fork(tx)
    }
  }

  public error(tx: Transaction, err: Error): void {
    this.forkError(tx, err)
  }

  public iend(tx: Transaction, idx: number): void {
    const isrc = this.source as IndexedSource<A>
    isrc.disposeIdx(idx)
    if (--this.nEndWait === 0) {
      this.forkEnd(tx)
    }
  }

  public join(tx: Transaction): void {
    if (this.has !== 0) {
      const project = this.f
      const send = this.has === EventType.INITIAL ? sendInitialSafely : sendNextSafely
      this.has = 0
      send(tx, this.dispatcher, project(this.vals))
    }
    super.join(tx)
  }

  public joinError(tx: Transaction, err: Error) {
    this.dispatcher.error(tx, err)
  }

  public joinEnd(tx: Transaction) {
    this.dispatcher.end(tx)
  }

  // PropertyMulticast will send no-initial event for late subscribers
  // hence only sending no-initial during first activation
  protected handleActivation(
    scheduler: Scheduler,
    subscriber: Subscriber<B>,
    order: number,
  ): Subscription {
    if (this.nInitWait === 0) {
      // PropertyMulticast will send no-initial event for late subscribers
      scheduler.schedulePropertyActivation(new SendNoInitialTask(subscriber))
    }
    return this.activate(scheduler, subscriber, order)
  }

  protected handleDispose(): void {
    this.resetState()
    this.dispose()
  }

  private resetState(): void {
    let n = this.vals.length
    while (n--) this.vals[n] = NONE
    this.nInitWait = (this.source as IndexedSource<A>).numSyncItems()
    this.nValWait = this.nEndWait = this.vals.length
    this.has = 0
    this.abortJoin()
  }
}

function slice<T>(arr: T[]): T[] {
  return arr.slice()
}
