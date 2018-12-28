import { __DEVBUILD__, assert, GENERIC_ERROR_MSG } from "./_assert"
import { isInTx, queueToEndOfTx, sendNextInTx, Source } from "./_core"
import { MutableSource } from "./_mutable"
import { MAX_PRIORITY } from "./_priority"
import { Operation, Transaction } from "./_tx"
import { curry2, is } from "./_util"
import { dispatcherOf } from "./Observable"
import { Operator } from "./operators/_base"
import { Property, PropertyDispatcher } from "./Property"

export type Lens<S, A> = ObjectSetLens<S, A> | ObjectUpdateLens<S, A> | VanLaarhovenLens<S, A>

export interface SetOp {
  <T>(atom: Atom<T>, value: T): void
  <T>(atom: Atom<T>): (value: T) => void
}

export interface ModifyOp {
  <T>(atom: Atom<T>, f: (state: T) => T): void
  <T>(atom: Atom<T>): (f: (state: T) => T) => void
}

export interface ViewOp {
  <S extends object, Prop extends keyof (S)>(atom: Atom<S>, prop: Prop): Atom<S[Prop]>
  <S extends object, Prop extends keyof (S)>(atom: Atom<S>): (prop: Prop) => Atom<S[Prop]>
  <S, A>(atom: Atom<S>, lens: Lens<S, A>): Atom<A>
  <S, A>(atom: Atom<S>): (lens: Lens<S, A>) => Atom<A>
}

export function atom<T>(initialValue: T): Atom<T> {
  return new RootAtom(initialValue)
}

export const get = _get
export const set: SetOp = curry2(_set)
export const modify: ModifyOp = curry2(_modify)
export const view: ViewOp = curry2(_view)

export abstract class Atom<T> extends Property<T> {}

function _get<T>(a: Atom<T>): T {
  return atomDispatcherOf(a).state()
}

function _modify<T>(a: Atom<T>, f: (state: T) => T): void {
  atomDispatcherOf(a).modify(f)
}

function _set<T>(a: Atom<T>, value: T): void {
  _modify(a, (_: T) => value)
}

function _view<S, A>(a: Atom<S>, lens: Lens<S, A> | string): Atom<A> {
  return new Cursor(new AtomDispatcher(new View(atomDispatcherOf(a), toObjectLens(lens))))
}

class RootAtom<T> extends Atom<T> {
  constructor(val: T) {
    super(new AtomDispatcher(new AtomSource(val)))
  }
}

class Cursor<T> extends Atom<T> {}

class AtomSource<T> extends MutableSource<T> {
  private q: boolean = false

  constructor(private v: T) {
    super()
  }

  public activate(initialNeeded: boolean): void {
    super.activate(false)
    if (initialNeeded) {
      this._sendValue(this.v)
    }
  }

  public state(): T {
    return this.v
  }

  public modify(f: (state: T) => T): void {
    const prev = this.v
    const next = (this.v = f(prev))
    if (next !== prev && this.active) {
      this._sendValue(next)
    }
  }

  public _sendLatest(tx: Transaction): void {
    this.q = false
    this.active && this.s.next(tx, this.v)
  }

  private _sendValue(value: T): void {
    if (isInTx() && !this.q) {
      this.q = true
      queueToEndOfTx(new SendLatestState(this))
    } else {
      sendNextInTx(this.s, value)
    }
  }
}

class View<S, A> extends Operator<S, A> implements AtomSrc<A> {
  constructor(source: Source<S> & AtomSrc<S>, private l: ObjectUpdateLens<S, A>) {
    super(source)
  }

  public next(tx: Transaction, val: S): void {
    const { get: getter } = this.l
    this.sink.next(tx, getter(val))
  }

  public state(): A {
    const state = ((this.source as any) as AtomSrc<S>).state()
    const { get: getter } = this.l
    return getter(state)
  }

  public modify(f: (state: A) => A): void {
    const s = (this.source as any) as AtomSrc<S>
    const { update } = this.l
    s.modify((state: S) => update(state, f))
  }
}

class AtomDispatcher<T> extends PropertyDispatcher<T> implements AtomSrc<T> {
  public next(tx: Transaction, val: T): void {
    const { val: prev } = this
    if (prev !== val) {
      this.sink.next(tx, (this.val = val))
    }
  }

  public state(): T {
    return ((this.source as any) as AtomSrc<T>).state()
  }

  public modify(f: (state: T) => T): void {
    // tslint:disable-next-line:whitespace semicolon
    ;((this.source as any) as AtomSrc<T>).modify(f)
  }
}

class SendLatestState<T> implements Operation {
  public readonly priority: number = MAX_PRIORITY
  constructor(private a: AtomSource<T> | null) {}

  public exec(tx: Transaction): void {
    const atomSource = this.a
    if (atomSource !== null) {
      atomSource._sendLatest(tx)
    }
  }

  public abort(): void {
    this.a = null
  }
}

interface Functor<A> {
  fmap<B>(fn: (a: A) => B): Functor<B>
}

interface AtomSrc<T> {
  state(): T
  modify(f: (state: T) => T): void
}

function toObjectLens<S, A>(lens: Lens<S, A> | string): ObjectUpdateLens<S, A> {
  if (typeof lens === "string") {
    const propGet = (s: S): A => (s as any)[lens]
    const propUpdate = (s: S, f: (a: A) => A): S =>
      (s === undefined
        ? { [lens]: f((undefined as any) as A) }
        : { ...s, [lens]: f((s as any)[lens]) }) as any
    return {
      get: propGet,
      update: propUpdate,
    }
  } else if (typeof lens === "function") {
    const lensGet = (s: S): A => ((lens(constant)(s) as any) as VFunctor<A>).val
    const lensUpdate = (s: S, f: (a: A) => A): S =>
      ((lens((a: A) => id(f(a)))(s) as any) as VFunctor<S>).val
    return {
      get: lensGet,
      update: lensUpdate,
    }
  } else if ("update" in lens) {
    if (__DEVBUILD__) {
      assert(typeof lens.update === "function", "'lens.update' must be a function")
      assert(typeof lens.get === "function", "'lens.get' must be a function")
    }
    return lens
  } else {
    if (__DEVBUILD__) {
      assert(typeof lens.set === "function", "'lens.set' must be a function")
      assert(typeof lens.get === "function", "'lens.get' must be a function")
    }
    const { get: lGet, set: lSet } = lens
    return {
      get: lGet,
      update: (s: S, f: (a: A) => A): S => lSet(f(lGet(s)), s),
    }
  }
}

interface ObjectSetLens<S, A> {
  get(s: S): A
  set(a: A, s: S): S
}

interface ObjectUpdateLens<S, A> {
  get(s: S): A
  update(s: S, f: (a: A) => A): S
}

type VanLaarhovenLens<S, A> = (a2f: (a: A) => Functor<A>) => (s: S) => Functor<S>

interface VFunctor<T> extends Functor<T> {
  val: T
}

function constant<T>(val: T): VFunctor<T> {
  return new Const(val)
}

function id<T>(val: T): VFunctor<T> {
  return new Id(val)
}

class Const<A> implements VFunctor<A> {
  constructor(public val: A) {}
  public fmap<B>(fn: (a: A) => B): VFunctor<B> {
    return (this as any) as VFunctor<B>
  }
  public map<B>(fn: (a: A) => B): VFunctor<B> {
    return this.fmap(fn)
  }
  public ["fantasy-land/map"]<B>(fn: (a: A) => B): VFunctor<B> {
    return this.fmap(fn)
  }
}

class Id<A> implements VFunctor<A> {
  constructor(public val: A) {}
  public fmap<B>(fn: (a: A) => B): VFunctor<B> {
    return new Id(fn(this.val))
  }
  public map<B>(fn: (a: A) => B): VFunctor<B> {
    return this.fmap(fn)
  }
  public ["fantasy-land/map"]<B>(fn: (a: A) => B): VFunctor<B> {
    return this.fmap(fn)
  }
}

function atomDispatcherOf<T>(a: Atom<T>): AtomDispatcher<T> {
  checkAtom(a)
  return (dispatcherOf(a) as any) as AtomDispatcher<T>
}

function checkAtom(x: any): void {
  const ok = is(x, Atom)
  assert(ok, __DEVBUILD__ ? (!ok ? `Expected an Atom but got ${x}` : "") : GENERIC_ERROR_MSG)
}
