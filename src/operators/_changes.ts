import { Transaction } from "../_tx"
import { Operator } from "./_base"

export abstract class InitialAndChanges<T> extends Operator<T, T> {
  private b: boolean = false

  public activate(initialNeeded: boolean): void {
    super.activate(initialNeeded)
    this.b = true
  }

  public dispose(): void {
    this.b = false
    super.dispose()
  }

  public next(tx: Transaction, val: T): void {
    if (this.b) {
      this.nextChange(tx, val)
    } else {
      this.nextInitial(tx, val)
    }
  }

  public abstract nextInitial(tx: Transaction, val: T): void

  public abstract nextChange(tx: Transaction, val: T): void
}

export abstract class Changes<T> extends InitialAndChanges<T> {
  public nextInitial(tx: Transaction, val: T): void {
    // no-op
  }
}

export abstract class Initial<T> extends InitialAndChanges<T> {
  public nextChange(tx: Transaction, val: T): void {
    // no-op
  }
}
