import { Source } from "../_core"
import { priorityOf } from "../_priority"
import { Operation, Transaction } from "../_tx"
import { disableNoUnusedWarning } from "../_util"
import { Operator } from "./_base"

export abstract class JoinOperator<A, B, P> extends Operator<A, B> {
  private __join: Join<P> | null = null

  constructor(origin: Source<A>, sync: boolean) {
    super(origin, sync)
    false && disableNoUnusedWarning(this.__handleJoin)
  }

  public abstract continueJoin(tx: Transaction, param: P): void

  protected queueJoin(tx: Transaction, param: P): void {
    this.__join === null &&
      tx.queue((this.__join = new Join(priorityOf(this.order, this.weight), this as any, param)))
  }

  private __handleJoin(tx: Transaction, param: P): void {
    this.__join = null
    this.continueJoin(tx, param)
  }
}

export class ErrorQueue {
  // TODO: older browser compatibility
  private has: boolean = false
  private errors: Set<Error> = new Set()
  private queue: Error[] = []

  public push(err: Error): void {
    if (!this.errors.has(err)) {
      this.errors.add(err)
      this.queue.push(err)
      this.has = true
    }
  }

  public hasErrors(): boolean {
    return this.has
  }

  public popAll(): Error[] {
    const q = this.queue
    this.queue = []
    this.errors.clear()
    return q
  }

  public clear(): void {
    if (this.has) {
      this.queue = []
      this.errors.clear()
    }
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
