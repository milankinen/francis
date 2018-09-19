import { checkFunctionOrProperty } from "../_check"
import { Source } from "../_core"
import { Projection } from "../_interfaces"
import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { curry2 } from "../_util"
import { dispatcherOf, Observable } from "../Observable"
import { isProperty, Property } from "../Property"
import { Operator } from "./_base"
import { sampleBy } from "./sample"

export interface MapOp {
  <A, B>(project: Projection<A, B> | Property<B>, observable: Observable<A>): Observable<B>
  <A, B>(project: Projection<A, B> | Property<B>): (observable: Observable<A>) => Observable<B>
}

export const map: MapOp = curry2(_map)

function _map<A, B>(
  project: Projection<A, B> | Property<B>,
  observable: Observable<A>,
): Observable<B> {
  checkFunctionOrProperty(project)
  return isProperty(project)
    ? sampleBy(observable, project)
    : makeObservable(observable, new Map(dispatcherOf(observable), project))
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
