import { __DEVBUILD__, assert } from "../_assert"
import { NONE } from "../_core"
import { toObs } from "../_interrop"
import { isObservable, makeProperty } from "../_obs"
import { Transaction } from "../_tx"
import { isArray, isObject, slice } from "../_util"
import { dispatcherOf, Observable } from "../Observable"
import { Property } from "../Property"
import { constant } from "../sources/single"
import { Indexed, IndexedEndSubscriber, IndexedSource } from "./_indexed"
import { JoinOperator } from "./_join"
import { map } from "./map"
import { toProperty } from "./toProperty"

export type Combineable<T> = Observable<T> | T

// TODO: fix combineAsArray typings
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

export type CombinedTemplate<O> = {
  [K in keyof O]: O[K] extends Observable<infer I>
    ? I
    : O[K] extends Record<any, any> ? CombinedTemplate<O[K]> : O[K]
}

export function combineTemplate<T>(template: T): Observable<CombinedTemplate<T>> {
  const observables = [] as Array<Observable<any>>
  const constants = [] as any[]
  function collect(obj: any): string {
    const props = [] as string[]
    Object.keys(obj).forEach(key => {
      const val: any = obj[key]
      const skey = JSON.stringify(key)
      if (isObservable(val)) {
        props.push(`${skey}:o[${observables.length}]`)
        observables.push(val)
      } else if (isObject(val)) {
        props.push(`${skey}:${collect(val)}`)
      } else {
        props.push(`${skey}:c[${constants.length}]`)
        constants.push(val)
      }
    })
    return "{" + props.join(",") + "}"
  }
  const collected = collect(template)
  if (observables.length === 0) {
    return constant(template) as any
  } else {
    const createPlainObject: any = new Function("o", "c", `return ${collected};`)
    const fn = (combined: any[]) => createPlainObject(combined, constants)
    return _combine(fn, observables) as any
  }
}

export function combineWith<A, R>(f: (a: A) => R, observables: [Combineable<A>]): Property<R>
export function combineWith<A, B, R>(
  f: (a: A, b: B) => R,
  observables: [Combineable<A>, Combineable<B>],
): Property<R>
export function combineWith<A, B, C, R>(
  f: (a: A, b: B, c: C) => R,
  observables: [Combineable<A>, Combineable<B>, Combineable<C>],
): Property<R>
export function combineWith<A, B, C, D, R>(
  f: (a: A, b: B, c: C, d: D) => R,
  observables: [Combineable<A>, Combineable<B>, Combineable<C>, Combineable<D>],
): Property<R>
export function combineWith<A, B, C, D, E, R>(
  f: (a: A, b: B, c: C, d: D, e: E) => R,
  observables: [Combineable<A>, Combineable<B>, Combineable<C>, Combineable<D>, Combineable<E>],
): Property<R>
export function combineWith<A, B, C, D, E, F, R>(
  f: (a: A, b: B, c: C, d: D, e: E, f: F) => R,
  observables: [
    Combineable<A>,
    Combineable<B>,
    Combineable<C>,
    Combineable<D>,
    Combineable<E>,
    Combineable<F>
  ],
): Property<R>
export function combineWith<T, R>(
  f: (...vals: T[]) => R,
  observables: Array<Combineable<T>>,
): Property<R> {
  return _combine<T, R>((vals: T[]) => f(...vals), observables)
}

export function _combine<A, B>(
  f: (vals: A[]) => B,
  observables: Array<Observable<A> | A>,
): Property<B> {
  let n = observables.length
  if (n === 0) {
    return map(f, constant([] as A[])) as Property<B>
  } else if (n === 1) {
    return toProperty(map(val => f([val]), toObs<A, Observable<A>>(observables[0])))
  } else {
    const sources = Array(n)
    while (n--) {
      sources[n] = dispatcherOf(toObs(observables[n]))
    }
    return makeProperty(new Combine<A, B>(new IndexedSource(sources), f))
  }
}

class Combine<A, B> extends JoinOperator<Indexed<A>, B> implements IndexedEndSubscriber<A> {
  private vals: A[]
  private has: boolean
  private nWaitV: number
  private nWaitE: number

  constructor(source: IndexedSource<A>, private f: (vals: A[]) => B) {
    super(source)
    source.setEndSubscriber(this)
    let n = (this.nWaitE = this.nWaitV = source.size())
    this.has = false
    this.vals = Array(n)
    while (n--) this.vals[n] = NONE
  }

  public dispose(): void {
    // Ended streams/props will re-emit the end event after activation so we need
    // to reset the end wait counter. However, only properties emit their latest
    // value so we can't reset that information - otherwise we might lose some information
    // between activations
    this.nWaitE = this.vals.length
    super.dispose()
  }

  public next(tx: Transaction, ival: Indexed<A>): void {
    const prev = this.vals[ival.idx]
    this.vals[ival.idx] = ival.val
    if ((prev === NONE && --this.nWaitV === 0) || this.nWaitV === 0) {
      this.has = true
      this.fork(tx)
    }
  }

  public error(tx: Transaction, err: Error): void {
    this.forkError(tx, err)
  }

  public iend(tx: Transaction, idx: number, source: IndexedSource<A>): void {
    source.disposeIdx(idx)
    if (--this.nWaitE === 0) {
      this.forkEnd(tx)
    }
  }

  public join(tx: Transaction): void {
    if (this.has === true) {
      const { f } = this
      this.has = false
      this.sink.next(tx, f(this.vals))
    }
    super.join(tx)
  }
}
