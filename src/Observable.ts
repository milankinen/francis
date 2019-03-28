import { Dispatcher } from "./_dispatcher"
import * as Sym from "./_symbols"

export interface HKT<SelfType> {
  [Sym.HKT]: SelfType
}

export abstract class Observable<A> implements HKT<Observable<A>> {
  public [Sym.HKT]!: Observable<A>
  public [Sym.DISPATCHER]: Dispatcher<A>

  constructor(d: Dispatcher<A>) {
    this[Sym.DISPATCHER] = d
  }

  public [Sym.observable]() {
    throw new Error("Not implemented")
  }
}

export function dispatcherOf<T>(obs: Observable<T>): Dispatcher<T> {
  return obs[Sym.DISPATCHER]
}
