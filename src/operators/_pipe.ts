import { Subscriber } from "../_core"
import { Transaction } from "../_tx"

export interface PipeDest<T> {
  isActive(): boolean
  pipedInitial(sender: Pipe<T>, tx: Transaction, val: T): void
  pipedNoInitial(sender: Pipe<T>, tx: Transaction): void
  pipedEvent(sender: Pipe<T>, tx: Transaction, val: T): void
  pipedError(sender: Pipe<T>, tx: Transaction, err: Error): void
  pipedEnd(sender: Pipe<T>, tx: Transaction): void
}

export class Pipe<T> implements Subscriber<T> {
  constructor(public dest: PipeDest<T>) {}

  public isActive(): boolean {
    return this.dest.isActive()
  }
  public initial(tx: Transaction, val: T): void {
    this.dest.pipedInitial(this, tx, val)
  }

  public noinitial(tx: Transaction): void {
    this.dest.pipedNoInitial(this, tx)
  }

  public event(tx: Transaction, val: T): void {
    this.dest.pipedEvent(this, tx, val)
  }

  public error(tx: Transaction, err: Error): void {
    this.dest.pipedError(this, tx, err)
  }

  public end(tx: Transaction): void {
    this.dest.pipedEnd(this, tx)
  }
}
