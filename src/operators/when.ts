import { __DEVBUILD__, assert } from "../_assert"
import {
  NONE,
  NOOP_SUBSCRIBER,
  NOOP_SUBSCRIPTION,
  Source,
  Subscriber,
  Subscription,
} from "../_core"
import { isObservable, makeEventStream } from "../_obs"
import { Transaction } from "../_tx"
import { isArray, isFunction } from "../_util"
import { EventStream, isEventStream } from "../EventStream"
import { Observable } from "../Observable"
import { Indexed, IndexedEndSubscriber, IndexedSource } from "./_indexed"
import { JoinOperator } from "./_join"

export function when(...patternsAndHandlers: any[]): EventStream<any> {
  if (__DEVBUILD__) {
    assert(
      patternsAndHandlers.length > 0 && patternsAndHandlers.length % 2 === 0,
      "Expecting arguments in the form (Observable+,function)+",
    )
  }

  const patterns = Array<Pattern>(patternsAndHandlers.length / 2)
  const idxLookup = new Map<Observable<any>, number>()
  for (let i = 0; i < patternsAndHandlers.length; i += 2) {
    const pattern = patternsAndHandlers[i] as Array<Observable<any>>
    const f = patternsAndHandlers[i + 1] as PatternHandler
    assert(isFunction(f), "Handler must be a function")
    assertPattern(pattern)
    const nIdx: any = {}
    const aheads = Array<number[]>(pattern.length)
    for (let o = 0; o < pattern.length; o++) {
      const obs = pattern[o]
      let idx = idxLookup.size
      if (idxLookup.has(obs)) {
        idx = idxLookup.get(obs) as number
      } else {
        idxLookup.set(obs, idx)
      }
      const ahead: number = isEventStream(obs) ? (nIdx[idx] = (nIdx[idx] || 0) + 1) : 0
      aheads[o] = [idx, ahead]
    }
    patterns[i / 2] = new Pattern(aheads, f)
  }

  const sources = Array<Buffered>(idxLookup.size)
  const buffers = Array<Buffer>(idxLookup.size)
  idxLookup.forEach((idx, obs) => {
    const buffer = isEventStream(obs) ? new StreamBuffer() : new PropertyBuffer()
    sources[idx] = new Buffered(obs.src, buffer)
    buffers[idx] = buffer
  })
  return makeEventStream(new When(new IndexedSource(sources), patterns, buffers))
}

class When extends JoinOperator<Indexed<Buffer>, any, null>
  implements IndexedEndSubscriber<Buffer> {
  private activePatterns: Pattern[]
  constructor(
    source: IndexedSource<Buffer>,
    private patterns: Pattern[],
    private buffers: Buffer[],
  ) {
    super(source)
    source.setEndSubscriber(this)
    this.activePatterns = patterns.slice()
  }

  public dispose(): void {
    this.activePatterns = this.patterns.slice()
    this.resetBuffers()
    this.abortJoin()
    super.dispose()
  }

  public next(tx: Transaction, val: Indexed<Buffer>): void {
    this.forkNext(tx, null)
  }

  public error(tx: Transaction, err: Error): void {
    this.forkError(tx, err)
  }

  public iend(tx: Transaction, idx: number, source: IndexedSource<Buffer>): void {
    source.disposeIdx(idx)
    if (this.buffers[idx].end()) {
      this.forkNext(tx, null)
    }
  }

  public joinNext(tx: Transaction, _: null): void {
    const { activePatterns, buffers } = this
    let i = 0
    while (i < activePatterns.length) {
      const pattern = activePatterns[i]
      const result = pattern.peek(buffers)
      if (result === READY) {
        const vals = pattern.pop(buffers)
        const handler = pattern.f
        const toEmit = handler(...vals)
        this.sink.next(tx, toEmit)
        return
      } else if (result === UNREACHABLE) {
        activePatterns.splice(i, 1)
      } else {
        ++i
      }
    }
    if (activePatterns.length === 0) {
      this.sink.end(tx)
    }
  }

  private resetBuffers(): void {
    const { buffers } = this
    let n = buffers.length
    while (n--) buffers[n].reset()
  }
}

class Buffered implements Subscriber<any>, Source<Buffer>, Subscription {
  public readonly weight: number
  private sub: Subscription = NOOP_SUBSCRIPTION
  private sink: Subscriber<Buffer> = NOOP_SUBSCRIBER

  constructor(private src: Source<any>, private buf: Buffer) {
    this.weight = src.weight
  }

  public subscribe(subscriber: Subscriber<Buffer>, order: number): Subscription {
    this.sink = subscriber
    this.sub = this.src.subscribe(this, order)
    return this
  }

  public activate(): void {
    return this.sub.activate()
  }

  public dispose(): void {
    const { sub } = this
    this.sub = NOOP_SUBSCRIPTION
    this.sink = NOOP_SUBSCRIBER
    sub.dispose()
  }

  public reorder(order: number): void {
    this.sub.reorder(order)
  }

  public begin(): boolean {
    return this.sink.begin()
  }

  public next(tx: Transaction, val: any): void {
    const { buf } = this
    if (buf.push(val)) {
      this.sink.next(tx, buf)
    }
  }

  public error(tx: Transaction, err: Error): void {
    this.sink.error(tx, err)
  }

  public end(tx: Transaction): void {
    const { buf } = this
    const wasConsumed = buf.end()
    wasConsumed && this.sink.next(tx, buf)
    this.sink.end(tx)
  }
}

enum PeekResult {
  //  value can be pop now
  READY = 2,
  //  can't pop now but maybe in future
  STANDBY = 1,
  //  can't pop anymore
  UNREACHABLE = 0,
}

const { READY, STANDBY, UNREACHABLE } = PeekResult

type PatternHandler = (...args: any[]) => any

type BufferPeek = (b: Buffer, n: number) => number
type PatternPeek = (buffers: Buffer[], peek: BufferPeek) => number
type BufferPop = (b: Buffer) => any
type PatternPop = (buffers: Buffer[], pop: BufferPop) => any[]

const bpeek: BufferPeek = (b, n) => b.peek(n)
const bpop: BufferPop = b => b.pop()

class Pattern {
  private readonly READY: number
  private ppeek: PatternPeek
  private ppop: PatternPop

  constructor(ah: number[][], public f: PatternHandler) {
    // pre-compile peek and pop functions with inlined indices so that engine
    // can optimize and inline them
    this.ppeek = new Function(
      "b",
      "p",
      `return ${ah.map(([bIdx, n]) => `p(b[${bIdx}],${n})`).join("*")};`,
    ) as PatternPeek
    this.ppop = new Function(
      "b",
      "p",
      `return [${ah.map(([bIdx]) => `p(b[${bIdx}])`).join(",")}];`,
    ) as PatternPop
    // "READY" is the target value that must acquired from ppeek in order to mark
    // this pattern as reeady for pop - if (and only if) every ahead check return 2,
    // the multiplication of these values will equal READY
    this.READY = ah.reduce(x => x * 2, 1)
  }

  public peek(buffers: Buffer[]): PeekResult {
    const ppeek = this.ppeek
    const result = ppeek(buffers, bpeek)
    // if any of the buffer peeks return 0 (can't pop anymore), the multiplied value
    // goes to zero, which indicates that pattern can't be acquired anymore and it
    // can be removed from the active patterns
    return result === 0 ? UNREACHABLE : result === this.READY ? READY : STANDBY
  }

  public pop(buffers: Buffer[]): any[] {
    const ppop = this.ppop
    return ppop(buffers, bpop)
  }
}

interface Buffer {
  push(x: any): boolean
  peek(n: number): PeekResult
  pop(): any
  end(): boolean
  reset(): void
}

const NIL = { v: NONE, n: NONE }

class StreamBuffer implements Buffer {
  private ended: boolean = false
  private head: BufferNode = NIL
  private tail: BufferNode = NIL
  private n: number = 0

  public push(val: any): boolean {
    if (this.n++ === 0) {
      this.head = this.tail = { v: val, n: NIL }
    } else {
      this.tail = this.tail.n = { v: val, n: NIL }
    }
    return true
  }
  public peek(n: number): PeekResult {
    return this.n >= n ? READY : this.ended ? UNREACHABLE : STANDBY
  }
  public pop(): any {
    const val = this.head.v
    this.head = this.head.n
    --this.n === 0 && (this.head = this.tail = NIL)
    return val
  }
  public end(): boolean {
    this.ended = true
    return this.n === 0
  }
  public reset(): void {
    this.ended = false
    this.head = this.tail = NIL
  }
}

class PropertyBuffer implements Buffer {
  private val: any = NONE
  public push(val: any): boolean {
    const hadValue = val !== NONE
    this.val = val
    return !hadValue
  }
  public peek(n: number): PeekResult {
    return this.val !== NONE ? READY : UNREACHABLE
  }
  public pop(): any {
    return this.val
  }
  public end(): boolean {
    return this.val === NONE
  }
  public reset(): void {
    this.val = NONE
  }
}

interface BufferNode {
  v: any
  n: BufferNode
}

function assertPattern(pattern: any[]) {
  assert(isArray(pattern), "Pattern must be an array [Observable+]")
  let hasStream = false
  for (let i = 0; i < pattern.length; i++) {
    const x = pattern[i]
    assert(isObservable(x), "All pattern components must be Observables")
    hasStream = hasStream || isEventStream(x)
  }
  assert(hasStream, "At least one EventStream required")
}
