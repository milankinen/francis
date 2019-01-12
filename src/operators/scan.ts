import { checkFunction, checkObservable } from "../_check"
import { sendNextInTx, Source } from "../_core"
import { Accum } from "../_interfaces"
import { makeProperty } from "../_obs"
import { Transaction } from "../_tx"
import { curry3 } from "../_util"
import { dispatcherOf, Observable } from "../Observable"
import { Property } from "../Property"
import { Operator } from "./_base"

/**
 * Scans `EventStream` or `Property` with given seed value and accumulator
 * function, resulting to a `Property`. The seed value is used as an initial
 * value for the result property.
 *
 * @param seed Seed value to use for the accumulation
 * @param acc Accumulator function `(state, value) => state`
 * @param observable Source observable
 *
 * @example
 *
 * F.pipe(F.fromArray(["!", "!"]),
 *  F.scan("Hello Francis", (state, value) => state + value),
 *  F.log("Greeting:"))
 * // logs: "Hello Francis", "Hello Francis!", "Hello Francis!!", <end>
 *
 * @stateful
 * @public
 */
export const scan: CurriedScan = curry3(_scan)
interface CurriedScan {
  <State, Value>(seed: State, acc: Accum<State, Value>, observable: Observable<Value>): Property<
    State
  >
  <State>(seed: State): <Value>(
    acc: Accum<State, Value>,
    observable: Observable<Value>,
  ) => Property<State>
  <State, Value>(seed: State, acc: Accum<State, Value>): (
    observable: Observable<Value>,
  ) => Property<State>
  <State>(seed: State): <Value>(
    acc: Accum<State, Value>,
  ) => (observable: Observable<Value>) => Property<State>
}

function _scan<S, T>(seed: S, acc: Accum<S, T>, observable: Observable<T>): Property<S> {
  checkObservable(observable)
  checkFunction(acc)
  return makeProperty(new Scan(dispatcherOf(observable), acc, seed))
}

class Scan<T, S> extends Operator<T, S> {
  private has: boolean = false
  constructor(source: Source<T>, private readonly acc: Accum<S, T>, private state: S) {
    super(source)
  }

  public activate(initialNeeded: boolean): void {
    super.activate(initialNeeded && !this.has)
    this.sendInitial()
  }

  public next(tx: Transaction, val: T): void {
    const { acc, state } = this
    this.has = true
    this.sink.next(tx, (this.state = acc(state, val)))
  }

  private sendInitial(): void {
    const shouldSent = this.active && !this.has
    this.has = true
    if (shouldSent) {
      sendNextInTx(this.sink, this.state)
    }
  }
}
