import { checkFunction } from "../_check"
import { Source } from "../_core"
import { In, Out, Projection } from "../_interfaces"
import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { curry2 } from "../_util"
import { dispatcherOf, Observable } from "../Observable"
import { Operator } from "./_base"

/**
 * Maps the `Observable`'s values using the given projection function.
 *
 * @param project Projection function `in => out`
 * @param observable Source observable
 * @returns An `Observable` having `project` function applied to its values
 *
 * @example
 *
 * F.pipe(F.fromArray([1, 2, 3]),
 *  F.map(x => x + 1),
 *  F.log("Result"))
 * // logs: 2, 3, 4, <end>
 *
 * @public
 * @endomorphic
 */
export const map: CurriedMap = curry2(_map)
interface CurriedMap {
  <ObsType, InType, OutType>(
    project: Projection<InType, OutType>,
    observable: In<ObsType, InType>,
  ): Out<ObsType, OutType>
  <InType, OutType>(project: Projection<InType, OutType>): <ObsType>(
    observable: In<ObsType, InType>,
  ) => Out<ObsType, OutType>
}

function _map<A, B>(project: Projection<A, B>, observable: Observable<A>): Observable<B> {
  checkFunction(project)
  return makeObservable(observable, new Map(dispatcherOf(observable), project))
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
