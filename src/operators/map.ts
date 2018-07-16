import { Source } from "../_core"
import { Projection } from "../_interfaces"
import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { EventStream } from "../EventStream"
import { Observable } from "../Observable"
import { isProperty, Property } from "../Property"
import { Operator } from "./_base"
import { sampleBy } from "./sample"

export function map<A, B>(
  project: Projection<A, B> | Property<B>,
  stream: EventStream<A>,
): EventStream<B>
export function map<A, B>(
  project: Projection<A, B> | Property<B>,
  property: Property<A>,
): Property<B>
export function map<A, B>(
  project: Projection<A, B> | Property<B>,
  observable: Observable<A>,
): Observable<B>
export function map<A, B>(
  project: Projection<A, B> | Property<B>,
  observable: Observable<A>,
): Observable<B> {
  return isProperty(project)
    ? sampleBy(observable, project)
    : makeObservable(observable, new Map(observable.src, project))
}

class Map<A, B> extends Operator<A, B> {
  constructor(source: Source<A>, private p: Projection<A, B>) {
    super(source)
  }

  public next(tx: Transaction, val: A): void {
    const project = this.p
    this.sink.next(tx, project(val))
  }
}
