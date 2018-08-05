import { Source } from "../_core"
import { Projection } from "../_interfaces"
import { toObs } from "../_interrop"
import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { curry2 } from "../_util"
import { Observable } from "../Observable"
import { once } from "../sources/single"
import { Operator } from "./_base"
import { flatMap } from "./flatMap"

export interface FlatMapErrorOp {
  <T>(project: Projection<Error, T | Observable<T>>, observable: Observable<T>): Observable<T>
  <T>(project: Projection<Error, T | Observable<T>>): (observable: Observable<T>) => Observable<T>
}

export const flatMapError: FlatMapErrorOp = curry2(_flatMapError)

function _flatMapError<T>(
  project: Projection<Error, T | Observable<T>>,
  observable: Observable<T>,
): Observable<T> {
  return flatMap<M<T>, T>(unpack, makeObservable(observable, new MapM(observable.src, project)))
}

class MapM<T> extends Operator<T, M<T>> {
  constructor(source: Source<T>, private p: Projection<Error, T | Observable<T>>) {
    super(source)
  }

  public next(tx: Transaction, val: T): void {
    this.sink.next(tx, new ValM(val))
  }

  public error(tx: Transaction, err: Error): void {
    this.sink.next(tx, new ErrM(err, this.p))
  }
}

interface M<T> {
  of(): Observable<T>
}

class ValM<T> implements M<T> {
  constructor(private v: T) {}
  public of(): Observable<T> {
    return once(this.v)
  }
}

class ErrM<T> implements M<T> {
  constructor(private e: Error, private p: Projection<Error, T | Observable<T>>) {}
  public of(): Observable<T> {
    const { e, p } = this
    return toObs(p(e))
  }
}

function unpack<T>(m: M<T>): Observable<T> {
  return m.of()
}
