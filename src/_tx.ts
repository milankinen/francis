export interface Operation {
  priority: number
  exec(tx: Transaction): void
  abort(): void
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
    if (n === head) {
      q.push(op)
    } else {
      while (n-- > head) {
        if (q[n].priority <= prio) {
          n + 1 === q.length ? q.push(op) : q.splice(n + 1, 0, op)
          return
        }
      }
      n === -1 ? q.unshift(op) : q.splice(n + 1, 0, op)
    }
  }

  public executePending(): void {
    if (this.has === true) {
      const { q } = this
      let op: Operation | undefined
      while ((op = q[this.cursor++]) !== undefined) {
        op.exec(this)
      }
      --this.cursor
    }
  }

  public abort(): void {
    if (this.has === true) {
      const { q } = this
      let op: Operation | undefined
      while ((op = q[this.cursor++]) !== undefined) {
        op.abort()
      }
      --this.cursor
    }
  }
}
