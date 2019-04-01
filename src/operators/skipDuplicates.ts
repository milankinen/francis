import { checkFunction } from "../_check"
import { Source } from "../_core"
import { In, Out } from "../_interfaces"
import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { curry2 } from "../_util"
import { dispatcherOf } from "../Observable"
import { Sliding } from "./slidingWindow"

export type Eq<T> = (a: T, b: T) => boolean

export const skipDuplicates: CurriedSkipDuplicates = curry2(_skipDuplicates)
export interface CurriedSkipDuplicates {
  <ObsType, ValueType>(isEqual: Eq<ValueType>, observable: In<ObsType, ValueType>): Out<
    ObsType,
    ValueType
  >
  <ValueType>(isEqual: Eq<ValueType>): <ObsType>(
    observable: In<ObsType, ValueType>,
  ) => Out<ObsType, ValueType>
}

export function skipEquals<ObsType, ValueType>(
  observable: In<ObsType, ValueType>,
): Out<ObsType, ValueType> {
  return _skipDuplicates((a, b) => a === b, observable)
}

function _skipDuplicates<ObsType, ValueType>(
  isEqual: Eq<ValueType>,
  observable: In<ObsType, ValueType>,
): Out<ObsType, ValueType> {
  checkFunction(isEqual)
  return makeObservable(observable, new SkipDuplicates(dispatcherOf(observable), isEqual))
}

class SkipDuplicates<T> extends Sliding<T, T> {
  constructor(source: Source<T>, private eq: Eq<T>) {
    super(source, 1, 2, [])
  }

  protected nextWin(tx: Transaction, win: T[]): void {
    if (win.length === 2) {
      const { eq } = this
      const [a, b] = win
      if (!eq(a, b)) {
        this.sink.next(tx, b)
      }
    } else {
      this.sink.next(tx, win[0])
    }
  }
}
