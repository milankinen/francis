import { Source } from "../_core"
import { Projection } from "../_interfaces"
import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { EventStream } from "../EventStream"
import { Observable } from "../Observable"
import { Property } from "../Property"
import { Operator } from "./_base"

export function map<A, B>(project: Projection<A, B>, stream: EventStream<A>): EventStream<B>
export function map<A, B>(project: Projection<A, B>, property: Property<A>): Property<B>
export function map<A, B>(project: Projection<A, B>, observable: Observable<A>): Observable<B> {
  return _map(project, observable)
}

export function _map<A, B>(project: Projection<A, B>, observable: Observable<A>): Observable<B> {
  return makeObservable(new Map(observable.op, project))
}

class Map<A, B> extends Operator<A, B> {
  constructor(source: Source<A>, private p: Projection<A, B>) {
    super(source, source.sync)
  }

  public next(tx: Transaction, val: A): void {
    const project = this.p
    this.dispatcher.next(tx, project(val))
  }

  public initial(tx: Transaction, val: A): void {
    const project = this.p
    this.dispatcher.initial(tx, project(val))
  }
}
