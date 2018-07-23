import { Source } from "../_core"
import { Transaction } from "../_tx"
import { EventStream } from "../EventStream"
import { Observable } from "../Observable"
import { handleActivations } from "../scheduler/index"
import { makeMultiSourceStream, MultiSource, MultiSourceNode } from "./_multisource"

export function concat<T>(...observables: Array<Observable<T>>): EventStream<T> {
  return concatAll(observables)
}

export function concatAll<T>(observables: Array<Observable<T>>): EventStream<T> {
  return makeMultiSourceStream<T>(observables, Concat)
}

class Concat<T> extends MultiSource<T> {
  constructor(sources: Array<Source<T>>) {
    super(sources, 1)
  }
  public mEnd(tx: Transaction, node: MultiSourceNode<T>): void {
    node.h !== null ? (node.h.t = node.t) : (this.head = node.t)
    node.t !== null && (node.t.h = node.h)
    node.dispose()
    const { head } = this
    if (head === null) {
      this.sink.end(tx)
    } else {
      head.subscribe(this.ord)
      head.activate(true)
      handleActivations()
    }
  }
}
