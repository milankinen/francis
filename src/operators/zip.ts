import { Source } from "../_core"
import { Projection } from "../_interfaces"
import { Transaction } from "../_tx"
import { identity } from "../_util"
import { EventStream } from "../EventStream"
import { Observable } from "../Observable"
import { AnyObs, isProperty, Property } from "../Property"
import { Operator } from "./_base"
import { Indexed, IndexedEndSubscriber, IndexedSource } from "./_indexed"
import { _map } from "./map"

export function zipAsArray<A, B>(s1: AnyObs<A>, s2: AnyObs<B>): EventStream<[A, B]>
export function zipAsArray<A, B, C>(
  s1: AnyObs<A>,
  s2: AnyObs<B>,
  s3: AnyObs<C>,
): EventStream<[A, B, C]>
export function zipAsArray<A, B, C, D>(
  s1: AnyObs<A>,
  s2: AnyObs<B>,
  s3: AnyObs<C>,
  s4: AnyObs<D>,
): EventStream<[A, B, C, D]>
export function zipAsArray<A, B, C, D, E>(
  s1: AnyObs<A>,
  s2: AnyObs<B>,
  s3: AnyObs<C>,
  s4: AnyObs<D>,
  s5: AnyObs<E>,
): EventStream<[A, B, C, D, E]>
export function zipAsArray<A, B, C, D, E, F>(
  s1: AnyObs<A>,
  s2: AnyObs<B>,
  s3: AnyObs<C>,
  s4: AnyObs<D>,
  s5: AnyObs<E>,
  s6: AnyObs<F>,
): EventStream<[A, B, C, D, E, F]>
export function zipAsArray(...streams: Array<AnyObs<any>>): EventStream<any[]>
export function zipAsArray<A, B>(p1: Property<A>, p2: Property<B>): Property<[A, B]>
export function zipAsArray<A, B, C>(
  p1: Property<A>,
  p2: Property<B>,
  p3: Property<C>,
): Property<[A, B, C]>
export function zipAsArray<A, B, C, D>(
  p1: Property<A>,
  p2: Property<B>,
  p3: Property<C>,
  p4: Property<D>,
): Property<[A, B, C, D]>
export function zipAsArray<A, B, C, D, E>(
  p1: Property<A>,
  p2: Property<B>,
  p3: Property<C>,
  p4: Property<D>,
  p5: Property<E>,
): Property<[A, B, C, D, E]>
export function zipAsArray<A, B, C, D, E, F>(
  p1: Property<A>,
  p2: Property<B>,
  p3: Property<C>,
  p4: Property<D>,
  p5: Property<E>,
  p6: Property<F>,
): Property<[A, B, C, D, E, F]>
export function zipAsArray(...properties: Array<Property<any>>): Property<any[]>
export function zipAsArray(...obs: Array<Observable<any>>): Observable<any[]> {
  if (Array.isArray(obs[0])) {
    // TODO: assert length
    return _zip(identity, (obs[0] as any) as Array<Observable<any>>)
  } else {
    return _zip(identity, obs)
  }
}

export function _zip<A, B>(
  f: Projection<A[], B>,
  observables: Array<Observable<A>>,
): Observable<B> {
  if (observables.length === 1) {
    return _map(a => f([a]), observables[0])
  }
  // TODO: add assertions
  let n = observables.length
  let np = 0
  const srcs = Array(n) as Array<Source<A>>
  while (n--) {
    const src = observables[n].op
    srcs[n] = src
    np += isProperty(src) ? 1 : 0
  }
  const op = new Zip(new IndexedSource(srcs), f)
  return np === observables.length ? new Property(op) : new EventStream(op)
}

const NIL = ({} as any) as BufferNode<any>

class Zip<A, B> extends Operator<Indexed<A>, B> implements IndexedEndSubscriber {
  private buffers: Array<Buffer<A>>
  private nWaitNext: number
  private nWaitEnd: number

  constructor(source: IndexedSource<A>, private f: Projection<A[], B>) {
    super(source)
    source.setEndSubscriber(this)
    this.buffers = Array(source.size())
    this.nWaitNext = this.nWaitEnd = 0
    this.resetBuffers()
  }

  public initial(tx: Transaction, val: Indexed<A>): void {
    this.handleEvent(tx, val, true)
  }

  // TODO no-initial case

  public event(tx: Transaction, val: Indexed<A>): void {
    this.handleEvent(tx, val, false)
  }

  public iend(tx: Transaction, idx: number): void {
    const bfs = this.buffers
    const b = bfs[idx]
    b.ended = true
    if (--this.nWaitEnd === 0 || b.n === 0) {
      // either all buffers are ended or this ended buffer didn't contain any values ->
      // we can't emit new values from zip anymore -> end the zip stream
      this.next.end(tx)
    } else {
      const isrc = this.source as IndexedSource<A>
      isrc.disposeIdx(idx)
    }
  }

  protected handleDispose(): void {
    this.resetBuffers()
    this.dispose()
  }

  private handleEvent(tx: Transaction, ival: Indexed<A>, initial: boolean): void {
    const { val, idx } = ival
    const buffer = this.buffers[idx]
    const wasEmpty = pushB(buffer, val)
    if (wasEmpty && --this.nWaitNext === 0) {
      const f = this.f
      const { vals, shouldEnd } = this.popVals()
      const result = f(vals)
      initial ? this.next.initial(tx, result) : this.next.event(tx, result)
      // tslint:disable-next-line:no-unused-expression
      shouldEnd && this.next.isActive() && this.next.end(tx)
    }
  }

  private popVals(): PopResult<A> {
    const bfs = this.buffers
    let n = bfs.length
    const vals = Array(n) as A[]
    let shouldEnd = false
    while (n--) {
      const b = bfs[n]
      vals[n] = b.head.val
      const isEmpty = popB(b)
      if (isEmpty) {
        ++this.nWaitNext
        // buffer is now empty and ended so we can't zip new values anymore, thus
        // we should end the zip stream now
        // tslint:disable-next-line:no-unused-expression
        b.ended && (shouldEnd = true)
      }
    }
    return { vals, shouldEnd }
  }

  private resetBuffers(): void {
    const bfs = this.buffers
    let n = bfs.length
    this.nWaitNext = this.nWaitEnd = n
    while (n--) {
      bfs[n] = { head: NIL, tail: NIL, n: 0, ended: false }
    }
  }
}

function pushB<T>(buffer: Buffer<T>, val: T): boolean {
  if (buffer.n++ === 0) {
    buffer.head = buffer.tail = { next: NIL, val }
    return true
  } else {
    buffer.tail = buffer.tail.next = { next: NIL, val }
    return false
  }
}

function popB(buffer: Buffer<any>): boolean {
  if (--buffer.n === 0) {
    buffer.head = buffer.tail = NIL
    return true
  } else {
    buffer.head = buffer.head.next
    return false
  }
}

interface Buffer<T> {
  head: BufferNode<T>
  tail: BufferNode<T>
  n: number
  ended: boolean
}

interface BufferNode<T> {
  val: T
  next: BufferNode<T>
}

interface PopResult<T> {
  vals: T[]
  shouldEnd: boolean
}
