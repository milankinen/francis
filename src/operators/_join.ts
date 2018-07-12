import { Source } from "../_core"
import { priorityOf } from "../_priority"
import { Operation, Transaction } from "../_tx"
import { disableNoUnusedWarning } from "../_util"
import { EventType, Operator } from "./_base"

export abstract class JoinOperator<A, B, Q> extends Operator<A, B> {
  private __join: Join | null = null
  private __errs: Set<Error> = new Set()
  private __head: ForkedEvent<Q> | null = null
  private __tail: ForkedEvent<Q> | null = null
  private __nq: number = 0
  private __he: boolean = false

  constructor(origin: Source<A>, sync: boolean) {
    super(origin, sync)
    false && disableNoUnusedWarning(this.__handleJoin)
  }

  public join(tx: Transaction): void {
    const n = this.__nq
    let head = this.__head
    this.__he && ((this.__he = false) || this.__errs.clear())
    this.__head = this.__tail = null
    this.__nq = 0
    // perf optimization: usual case is that we have only one, so let's write it explictly
    if (n === 1) {
      this.__handleFE(tx, head as ForkedEvent<Q>)
    } else {
      const { dispatcher } = this
      while (head !== null && dispatcher.isActive()) {
        this.__handleFE(tx, head)
        head = head.n
      }
    }
  }

  protected fork(tx: Transaction): void {
    this.__join === null &&
      tx.queue((this.__join = new Join(priorityOf(this.order, this.weight), this as any)))
  }

  protected isForked(): boolean {
    return this.__head !== null
  }

  protected abortJoin(): void {
    this.__he && ((this.__he = false) || this.__errs.clear())
    this.__head = this.__tail = null
    this.__nq = 0
  }

  protected forkNoInitial(tx: Transaction): void {
    this.__forke(tx, { t: EventType.NO_INITIAL, n: null })
  }

  protected forkInitial(tx: Transaction, val: Q): void {
    this.__forke(tx, { t: EventType.INITIAL, v: val, n: null })
  }

  protected forkNext(tx: Transaction, val: Q): void {
    this.__forke(tx, { t: EventType.NEXT, v: val, n: null })
  }

  protected forkError(tx: Transaction, err: Error): void {
    if (!this.__errs.has(err)) {
      this.__he = true
      this.__errs.add(err)
      this.__forke(tx, { t: EventType.ERROR, e: err, n: null })
    }
  }

  protected forkEnd(tx: Transaction): void {
    this.__forke(tx, { t: EventType.END, n: null })
  }

  protected forkCustom(tx: Transaction, val: any): void {
    this.__forke(tx, { t: -1 as any, v: val, n: null })
  }

  protected joinNoInitial(tx: Transaction): void {}
  protected joinInitial(tx: Transaction, val: Q): void {}
  protected joinNext(tx: Transaction, val: Q): void {}
  protected joinError(tx: Transaction, err: Error): void {}
  protected joinEnd(tx: Transaction): void {}
  protected joinCustom(tx: Transaction, val: any): void {}

  private __handleFE(tx: Transaction, fe: ForkedEvent<Q>): void {
    switch (fe.t) {
      case EventType.NEXT:
        this.joinNext(tx, (fe.v as any) as Q)
        break
      case EventType.INITIAL:
        this.joinInitial(tx, (fe.v as any) as Q)
        break
      case EventType.NO_INITIAL:
        this.joinNoInitial(tx)
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

  private __handleJoin(tx: Transaction): void {
    this.__join = null
    this.join(tx)
  }

  private __forke(tx: Transaction, fe: ForkedEvent<Q>) {
    ++this.__nq
    this.__tail === null ? (this.__head = this.__tail = fe) : (this.__tail = this.__tail.n = fe)
    this.fork(tx)
  }
}

class Join implements Operation {
  constructor(public priority: number, private target: Continuation) {}

  public exec(tx: Transaction): void {
    this.target.__handleJoin(tx)
  }
}

interface Continuation {
  __handleJoin(tx: Transaction): void
}

interface ForkedEvent<T> {
  t: EventType
  v?: T
  e?: Error
  n: ForkedEvent<T> | null
}
