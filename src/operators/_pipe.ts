import { Subscriber } from "../_core"
import { Transaction } from "../_tx"

export interface PipeDest<T> {
  pipedNext(sender: Pipe<T>, tx: Transaction, val: T): void
  pipedError(sender: Pipe<T>, tx: Transaction, err: Error): void
  pipedEnd(sender: Pipe<T>, tx: Transaction): void
}

export class Pipe<T> implements Subscriber<T> {
  constructor(public dest: PipeDest<T>) {}

  public next(tx: Transaction, val: T): void {
    this.dest.pipedNext(this, tx, val)
  }

  public error(tx: Transaction, err: Error): void {
    this.dest.pipedError(this, tx, err)
  }

  public end(tx: Transaction): void {
    this.dest.pipedEnd(this, tx)
  }
}
