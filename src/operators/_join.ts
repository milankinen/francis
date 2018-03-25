import { Source } from "../_core"
import { initPriority } from "../_priority"
import { Operation, Transaction } from "../_tx"
import { disableNoUnusedWarning } from "../_util"
import { Operator } from "./_base"

export abstract class JoinOperator<A, B, P> extends Operator<A, B> {
  private __join: Join<P> | null = null

  constructor(origin: Source<A>) {
    super(origin)
    false && disableNoUnusedWarning(this.__handleJoin)
  }

  public abstract continueJoin(tx: Transaction, param: P): void

  protected queueJoin(tx: Transaction, param: P): void {
    this.__join === null &&
      tx.queue((this.__join = new Join(initPriority(this.weight, this.order), this as any, param)))
  }

  private __handleJoin(tx: Transaction, param: P): void {
    this.__join = null
    this.continueJoin(tx, param)
  }
}

class Join<T> implements Operation {
  constructor(public priority: number, private target: Continuation<T>, private param: T) {}

  public exec(tx: Transaction): void {
    this.target.__handleJoin(tx, this.param)
  }
}

interface Continuation<T> {
  __handleJoin(tx: Transaction, val: T): void
}
