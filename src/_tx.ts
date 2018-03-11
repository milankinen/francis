export interface Operation {
  priority: number
  exec(tx: Transaction): void
}

export class Transaction {
  private has: boolean = false
  private q: Operation[] = []
  private cursor: number = 0

  public queue(op: Operation): void {
    const prio = op.priority
    const q = this.q
    const head = this.cursor
    let n = q.length
    this.has = true
    while (n > head && q[--n].priority > prio);
    if (n === q.length) {
      q.push(op)
    } else {
      q.splice(n, 0, op)
    }
  }

  public executePending(): void {
    if (this.has === true) {
      // TODO: while or recursion?
      this._exec(this.q[this.cursor++])
      this.cursor = 0
      this.q = []
      this.has = false
    }
  }

  private _exec(op: Operation | undefined): void {
    if (op !== undefined) {
      op.exec(this)
      this._exec(this.q[this.cursor++])
    }
  }
}
