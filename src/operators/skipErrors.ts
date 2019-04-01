import { In, Out } from "../_interfaces"
import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { dispatcherOf } from "../Observable"
import { Identity } from "./_base"

export function skipErrors<ObsType, ValueType>(
  observable: In<ObsType, ValueType>,
): Out<ObsType, ValueType> {
  return makeObservable(observable, new SkipErrors(dispatcherOf(observable)))
}

class SkipErrors<T> extends Identity<T> {
  public error(tx: Transaction, err: Error): void {}
}
