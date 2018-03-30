import { __DEVBUILD__, assert } from "../_assert"
import {
  NONE,
  sendEndSafely,
  sendErrorSafely,
  sendInitialSafely,
  sendNextSafely,
  Subscriber,
  Subscription,
} from "../_core"
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
import { ErrorQueue, JoinOperator } from "./_join"
import { _map, map } from "./map"
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
    return toProperty(_map(val => f([val]), toObservable<A, Observable<A>>(observables[0])))
  } else {
    const sources = Array(n)
    while (n--) {
      const obs = toObservable(observables[n])
      sources[n] = obs.op
    }
    return makeProperty(new Combine<A, B>(new IndexedSource(sources), f))
  }
}

class Combine<A, B> extends JoinOperator<Indexed<A>, B, null> implements IndexedEndSubscriber {
  private vals: A[]
  private nInitialsLeft: number
  private nValsLeft: number
  private nEndsLeft: number
  private qNext: EventType.INITIAL | EventType.EVENT | 0 = 0
  private qEnd: EventType.END | 0 = 0
  private qErrors: ErrorQueue = new ErrorQueue()

  constructor(source: IndexedSource<A>, private f: (vals: A[]) => B) {
    super(source, true)
    source.setEndSubscriber(this)
    const n = source.size()
    this.vals = Array(n)
    this.nValsLeft = this.nEndsLeft = n
    this.nInitialsLeft = source.numSyncItems()
    this.resetState()
  }

  public initial(tx: Transaction, ival: Indexed<A>): void {
    const { val, idx } = ival
    const prev = this.vals[idx]
    this.vals[idx] = val
    --this.nInitialsLeft
    if ((prev === NONE && --this.nValsLeft === 0) || this.nValsLeft === 0) {
      this.qNext = EventType.INITIAL
      this.queueJoin(tx, null)
    } else if (this.nInitialsLeft === 0) {
      this.dispatcher.noinitial(tx)
    }
  }

  public noinitial(tx: Transaction): void {
    if (--this.nInitialsLeft === 0) {
      this.dispatcher.noinitial(tx)
    }
  }

  public next(tx: Transaction, ival: Indexed<A>): void {
    const { val, idx } = ival
    const prev = this.vals[idx]
    this.vals[idx] = val
    if ((prev === NONE && --this.nValsLeft === 0) || this.nValsLeft === 0) {
      this.qNext = EventType.EVENT
      this.queueJoin(tx, null)
    }
  }

  public error(tx: Transaction, err: Error): void {
    this.qErrors.push(err)
    this.queueJoin(tx, null)
  }

  public iend(tx: Transaction, idx: number): void {
    if (--this.nEndsLeft === 0) {
      this.qEnd = EventType.END
      this.queueJoin(tx, null)
    } else {
      const isrc = this.source as IndexedSource<A>
      isrc.disposeIdx(idx)
    }
  }

  public continueJoin(tx: Transaction, ignore: null): void {
    if (this.qNext !== 0) {
      const isInitial = this.qNext === EventType.INITIAL
      const { f } = this
      this.qNext = 0
      this.isActive() &&
        (isInitial
          ? sendInitialSafely(tx, this.dispatcher, f(this.vals))
          : sendNextSafely(tx, this.dispatcher, f(this.vals)))
    }
    if (this.qErrors.hasErrors()) {
      const errs = this.qErrors.popAll()
      const n = errs.length
      for (let i = 0; this.isActive() && i < n; i++) {
        sendErrorSafely(tx, this.dispatcher, errs[i])
      }
    }
    if (this.qEnd !== 0) {
      this.qEnd = 0
      this.isActive() && sendEndSafely(tx, this.dispatcher)
    }
  }

  protected handleActivation(
    scheduler: Scheduler,
    subscriber: Subscriber<B>,
    order: number,
  ): Subscription {
    if (this.nInitialsLeft === 0) {
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
    this.nInitialsLeft = (this.source as IndexedSource<A>).numSyncItems()
    this.nValsLeft = this.nEndsLeft = n
    this.qEnd = this.qNext = 0
    this.qErrors.clear()
    while (n--) {
      this.vals[n] = NONE
    }
  }
}

function slice<T>(arr: T[]): T[] {
  return arr.slice()
}
