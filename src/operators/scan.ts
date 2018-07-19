import { sendNextInTx, Source } from "../_core"
import { Accum } from "../_interfaces"
import { makeProperty } from "../_obs"
import { Transaction } from "../_tx"
import { Observable } from "../Observable"
import { Property } from "../Property"
import { Operator } from "./_base"

export function scan<S, T>(seed: S, acc: Accum<S, T>, observable: Observable<T>): Property<S> {
  return makeProperty(new Scan(observable.src, acc, seed))
}

class Scan<T, S> extends Operator<T, S> {
  private has: boolean = false
  constructor(source: Source<T>, private readonly acc: Accum<S, T>, private state: S) {
    super(source)
  }

  public activate(initialNeeded: boolean): void {
    super.activate(initialNeeded)
    this.sendInitial()
  }

  public next(tx: Transaction, val: T): void {
    const { acc, state } = this
    this.has = true
    this.sink.next(tx, (this.state = acc(state, val)))
  }

  private sendInitial(): void {
    if (this.active && !this.has) {
      this.has = true
      sendNextInTx(this.sink, this.state)
    }
  }
}
