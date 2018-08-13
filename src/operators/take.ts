import { checkNaturalInt } from "../_check"
import { EndStateAware, Source } from "../_core"
import { makeStatefulObservable } from "../_obs"
import { Transaction } from "../_tx"
import { curry2 } from "../_util"
import { Observable } from "../Observable"
import { Operator } from "./_base"

export interface TakeOp {
  <T>(n: number, observable: Observable<T>): Observable<T>
  <T>(n: number): (observable: Observable<T>) => Observable<T>
}

export const take: TakeOp = curry2(_take)

function _take<T>(n: number, observable: Observable<T>): Observable<T> {
  checkNaturalInt(n)
  return makeStatefulObservable(observable, new Take(observable.src, n))
}

class Take<T> extends Operator<T, T> implements EndStateAware {
  constructor(source: Source<T>, private n: number) {
    super(source)
  }

  public next(tx: Transaction, val: T): void {
    const n = this.n > 0 ? --this.n : 0
    this.sink.next(tx, val)
    n === 0 && this.sink.end(tx)
  }

  public isEnded(): boolean {
    return this.n === 0
  }
}
