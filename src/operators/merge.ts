import { Source } from "../_core"
import { Set } from "../_polyfill"
import { priorityOf } from "../_priority"
import { Operation, Transaction } from "../_tx"
import { MAX_SAFE_INTEGER } from "../_util"
import { EventStream } from "../EventStream"
import { Observable } from "../Observable"
import { makeMultiSourceStream, MultiSource, MultiSourceNode } from "./_multisource"

export function merge<ValueType>(
  ...observables: Array<Observable<ValueType>>
): EventStream<ValueType> {
  return mergeAll(observables)
}

export function mergeAll<ValueType>(
  observables: Array<Observable<ValueType>>,
): EventStream<ValueType> {
  return makeMultiSourceStream<ValueType>(observables, Merge)
}

class Merge<T> extends MultiSource<T> {
  private j: boolean = false
  private errs: Set<Error> = new Set()
  private eq: Error[] = []

  constructor(sources: Array<Source<T>>) {
    super(sources, MAX_SAFE_INTEGER)
  }

  public dispose(): void {
    this.clear()
    super.dispose()
  }

  public mError(tx: Transaction, err: Error): void {
    if (this.j === false && !this.errs.has(err)) {
      this.j = true
      this.errs.add(err)
      this.eq.push(err)
      tx.queue(new MergeJoin(priorityOf(this.ord, this.weight), this))
    }
  }

  public join(tx: Transaction) {
    const { eq } = this
    let n = eq.length
    this.clear()
    while (this.active && n--) {
      this.sink.error(tx, eq[n])
    }
  }

  public mEnd(tx: Transaction, node: MultiSourceNode<T>): void {
    node.h !== null ? (node.h.t = node.t) : (this.head = node.t)
    node.t !== null && (node.t.h = node.h)
    node.dispose()
    if (this.head === null) {
      this.sink.end(tx)
    }
  }

  public clear(): void {
    this.errs = new Set()
    this.eq = []
    this.j = false
  }
}

class MergeJoin<T> implements Operation {
  constructor(public readonly priority: number, private m: Merge<T>) {}
  public exec(tx: Transaction): void {
    this.m.join(tx)
  }

  public abort(): void {
    this.m.clear()
  }
}
