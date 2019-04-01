import { NONE } from "../_core"
import { In, Out } from "../_interfaces"
import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { dispatcherOf } from "../Observable"
import { Operator } from "./_base"

export function last<ObsType, ValueType>(
  observable: In<ObsType, ValueType>,
): Out<ObsType, ValueType> {
  return makeObservable(observable, new Last(dispatcherOf(observable)))
}

class Last<T> extends Operator<T, T> {
  private val: T = NONE

  public next(tx: Transaction, val: T): void {
    this.val = val
  }

  public end(tx: Transaction): void {
    if (this.val !== NONE) {
      this.sink.next(tx, this.val)
    }
    this.sink.end(tx)
  }
}
