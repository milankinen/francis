import { Source } from "../_core"
import { priorityOf } from "../_priority"
import { Operation, Transaction } from "../_tx"
import { EventType, Operator } from "./_base"

export abstract class JoinOperator<A, B> extends Operator<A, B> {
  private forked: boolean = false
  private errs: Set<Error> = new Set()
  private head: ForkedEvent<B> | null = null
  private tail: ForkedEvent<B> | null = null
  private n: number = 0
  private hasErr: boolean = false

  constructor(origin: Source<A>) {
    super(origin)
  }

  public dispose(): void {
    this.abortJoin()
    super.dispose()
  }

  public startJoin(tx: Transaction): void {
    this.forked = false
    this.join(tx)
  }

  public abortJoin(): void {
    this.forked = false
    this.hasErr && ((this.hasErr = false) || this.errs.clear())
    this.head = this.tail = null
    this.n = 0
  }

  public join(tx: Transaction): void {
    const n = this.n
    let head = this.head
    this.hasErr && ((this.hasErr = false) || this.errs.clear())
    this.head = this.tail = null
    this.n = 0
    // perf optimization: usual case is that we have only one, so let's write it explictly
    if (n === 1) {
      this.handleFE(tx, head as ForkedEvent<B>)
    } else {
      while (head !== null && this.active) {
        this.handleFE(tx, head)
        head = head.n
      }
    }
  }

  protected fork(tx: Transaction): void {
    if (this.forked === false) {
      this.forked = true
      tx.queue(new Join(priorityOf(this.ord, this.weight), this as any))
    }
  }

  protected isForked(): boolean {
    return this.forked
  }

  protected forkNext(tx: Transaction, val: B): void {
    this.fe(tx, { t: EventType.NEXT, v: val, n: null, e: null as any })
  }

  protected forkError(tx: Transaction, err: Error): void {
    if (!this.errs.has(err)) {
      this.hasErr = true
      this.errs.add(err)
      this.fe(tx, { t: EventType.ERROR, e: err, n: null, v: null as any })
    }
  }

  protected forkEnd(tx: Transaction): void {
    this.fe(tx, { t: EventType.END, n: null, e: null as any, v: null as any })
  }

  protected forkCustom(tx: Transaction, val: any): void {
    this.fe(tx, { t: -1 as any, v: val, n: null, e: null as any })
  }

  protected joinNext(tx: Transaction, val: B): void {
    // TODO: send in try-catch block (sendNext)??
    this.sink.next(tx, val)
  }

  protected joinError(tx: Transaction, err: Error): void {
    this.sink.error(tx, err)
  }

  protected joinEnd(tx: Transaction): void {
    this.sink.end(tx)
  }

  protected joinCustom(tx: Transaction, val: any): void {}

  private handleFE(tx: Transaction, fe: ForkedEvent<B>): void {
    switch (fe.t) {
      case EventType.NEXT:
        this.joinNext(tx, (fe.v as any) as B)
        break
      case EventType.ERROR:
        this.joinError(tx, (fe.e as any) as Error)
        break
      case EventType.END:
        this.joinEnd(tx)
        break
      default:
        this.joinCustom(tx, fe.v)
        break
    }
  }

  private fe(tx: Transaction, fe: ForkedEvent<B>) {
    ++this.n
    this.tail === null ? (this.head = this.tail = fe) : (this.tail = this.tail.n = fe)
    this.fork(tx)
  }
}

class Join implements Operation {
  constructor(public priority: number, private target: JoinOperator<any, any>) {}

  public exec(tx: Transaction): void {
    this.target.startJoin(tx)
  }

  public abort(): void {
    this.target.abortJoin()
  }
}

interface ForkedEvent<T> {
  t: EventType
  v?: T
  e?: Error
  n: ForkedEvent<T> | null
}
