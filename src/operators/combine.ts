import { NONE, sendEventSafely, sendInitialSafely } from "../_core"
import { Transaction } from "../_tx"
import { Observable } from "../Observable"
import { isProperty, Property } from "../Property"
import { Indexed, IndexedEndSubscriber, IndexedSource } from "./_indexed"
import { JoinOperator } from "./_join"

export function combineAsArray<T>(observables: Array<Observable<T>>): Property<T[]>
export function combineAsArray<A>(o1: Observable<A>): Property<[A]>
export function combineAsArray<A, B>(o1: Observable<A>, o2: Observable<B>): Property<[A, B]>
export function combineAsArray<A, B, C>(
  o1: Observable<A>,
  o2: Observable<B>,
  o3: Observable<C>,
): Property<[A, B, C]>
export function combineAsArray<A, B, C, D>(
  o1: Observable<A>,
  o2: Observable<B>,
  o3: Observable<C>,
  o4: Observable<D>,
): Property<[A, B, C, D]>
export function combineAsArray<A, B, C, D, E>(
  o1: Observable<A>,
  o2: Observable<B>,
  o3: Observable<C>,
  o4: Observable<D>,
  o5: Observable<E>,
): Property<[A, B, C, D, E]>
export function combineAsArray<A, B, C, D, E, F>(
  o1: Observable<A>,
  o2: Observable<B>,
  o3: Observable<C>,
  o4: Observable<D>,
  o5: Observable<E>,
  o6: Observable<F>,
): Property<[A, B, C, D, E, F]>
export function combineAsArray(...observables: Array<Observable<any>>): Property<any[]>
export function combineAsArray<T>(...observables: any[]): Property<T[]> {
  if (Array.isArray(observables[0])) {
    // TODO: assert length
    return _combine<T, T[]>(slice, observables[0])
  } else {
    return _combine<T, T[]>(slice, observables)
  }
}

export function _combine<A, B>(
  f: (vals: A[]) => B,
  observables: Array<Observable<A>>,
): Property<B> {
  let n = observables.length
  let nProps = 0
  const sources = Array(n)
  while (n--) {
    // TODO: ensure that obs is actually an observable
    const obs = observables[n]
    // tslint:disable-next-line:no-unused-expression
    isProperty(obs) && ++nProps
    sources[n] = obs.op
  }
  const op = new Combine<A, B>(new IndexedSource(sources), nProps, f)
  return new Property(op)
}

class Combine<A, B> extends JoinOperator<Indexed<A>, B, null> implements IndexedEndSubscriber {
  private vals: A[]
  private nInitials: number
  private nVals: number
  private nEnds: number
  private sendInitial: boolean

  constructor(source: IndexedSource<A>, private nProps: number, private f: (vals: A[]) => B) {
    super(source)
    const n = source.size()
    this.vals = Array(n)
    this.nVals = this.nEnds = n
    this.nInitials = nProps
    this.sendInitial = false
    this.resetBuffer()
  }

  public initial(tx: Transaction, ival: Indexed<A>): void {
    const { val, idx } = ival
    const prev = this.vals[idx]
    this.vals[idx] = val
    --this.nInitials
    if ((prev === NONE && --this.nVals === 0) || this.nVals === 0) {
      this.sendInitial = true
      this.queueJoin(tx, null)
    } else if (this.nInitials === 0) {
      this.next.noinitial(tx)
    }
  }

  public noinitial(tx: Transaction): void {
    if (--this.nInitials === 0) {
      this.next.noinitial(tx)
    }
  }

  public event(tx: Transaction, ival: Indexed<A>): void {
    const { val, idx } = ival
    const prev = this.vals[idx]
    this.vals[idx] = val
    if ((prev === NONE && --this.nVals === 0) || this.nVals === 0) {
      this.sendInitial = false
      this.queueJoin(tx, null)
    }
  }

  public iend(tx: Transaction, idx: number): void {
    if (--this.nEnds === 0) {
      this.next.end(tx)
    } else {
      const isrc = this.source as IndexedSource<A>
      isrc.disposeIdx(idx)
    }
  }

  public continueJoin(tx: Transaction, ignore: null): void {
    const f = this.f
    if (this.isActive()) {
      this.sendInitial
        ? sendInitialSafely(tx, this.next, f(this.vals))
        : sendEventSafely(tx, this.next, f(this.vals))
    }
  }

  protected handleDispose(): void {
    this.resetBuffer()
    this.dispose()
  }

  private resetBuffer(): void {
    let n = this.vals.length
    this.nInitials = this.nProps
    this.nVals = this.nEnds = n
    while (n--) {
      this.vals[n] = NONE
    }
  }
}

function slice<T>(arr: T[]): T[] {
  return arr.slice()
}
