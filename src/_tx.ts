import { __DEVELOPER__, assert } from "./_assert"

export interface Operation {
  priority: number
  exec(tx: Transaction): void
  abort(): void
}

let preBeginAssert = (_: Transaction): void => {}
if (__DEVELOPER__) {
  preBeginAssert = (tx: Transaction): void => {
    assert(!tx.running, "** BUG ** Trying to emit multiple events within same transaction")
  }
}

export class Transaction {
  public readonly depth: number
  public running: boolean = false
  private has: boolean = false
  private q: Operation[] = []
  private n: number = 0
  private cursor: number = 0

  constructor(public readonly parent: Transaction | null) {
    this.depth = parent !== null ? parent.depth + 1 : 0
  }

  public begin(): void {
    preBeginAssert(this)
    this.running = true
  }

  public queue(op: Operation): void {
    const prio = op.priority
    const q = this.q
    const head = this.cursor
    let n = q.length
    this.has = true
    ++this.n
    if (n === head) {
      q.push(op)
    } else {
      while (n-- > head) {
        if (q[n].priority <= prio) {
          n === this.n ? q.push(op) : q.splice(n + 1, 0, op)
          return
        }
      }
      n === -1 ? q.unshift(op) : q.splice(n + 1, 0, op)
    }
  }

  public consume(): void {
    if (this.has === true) {
      const { q } = this
      while (this.cursor < this.n) {
        q[this.cursor++].exec(this)
      }
      this.n = this.cursor = 0
      this.q = []
      this.has = false
    }
    this.running = false
  }

  public abort(): void {
    if (this.has === true) {
      const { q } = this
      let op: Operation | undefined
      while ((op = q[this.cursor++]) !== undefined) {
        op.abort()
      }
      this.n = this.cursor = 0
      this.q = []
      this.has = false
    }
    this.running = false
  }
}
