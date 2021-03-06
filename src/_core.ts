import { __DEVELOPER__, assert, logAndThrow } from "./_assert"
import { MAX_PRIORITY } from "./_priority"
import { Operation, Transaction } from "./_tx"
import { Task } from "./scheduler/index"

export interface Subscriber<T> {
  next(tx: Transaction, val: T): void

  error(tx: Transaction, err: Error): void

  end(tx: Transaction): void
}

export interface Subscription {
  activate(initialNeeded: boolean): void

  dispose(): void

  reorder(order: number): void
}

export interface Source<T> {
  readonly weight: number
  subscribe(subscriber: Subscriber<T>, order: number): Subscription
}

// tslint:disable-next-line:no-shadowed-variable
export const NONE = new class NONE {}() as any

export const NOOP_SUBSCRIBER = new class NoopSubscriber implements Subscriber<any> {
  public next(tx: Transaction, val: any): void {}
  public error(tx: Transaction, err: Error): void {}
  public end(tx: Transaction): void {}
}()

export const NOOP_SUBSCRIPTION = new class NoopSubscription implements Subscription {
  public activate(initialNeeded: boolean): void {}
  public dispose(): void {}
  public reorder(order: number): void {}
}()

// this global tx will be changed when stepping in/out between scheduling frames
let TX: Transaction = new class PlaceholderTx extends Transaction {
  constructor() {
    super(null)
  }
  public begin(): void {
    if (__DEVELOPER__) {
      logAndThrow("** BUG ** SchedulingContext should reset the root transaction")
    }
  }
}()

export function setTx(tx: Transaction): void {
  TX = tx
}

export function isInTx(): boolean {
  return TX.running
}

export function sendNextInTx<T>(subscriber: Subscriber<T>, val: T): void {
  try {
    TX.begin()
    subscriber.next(TX, val)
    TX.consume()
  } catch (ex) {
    TX.abort()
    throw ex
  }
}

export function sendEndInTx(subscriber: Subscriber<any>): void {
  try {
    TX.begin()
    subscriber.end(TX)
    TX.consume()
  } catch (ex) {
    TX.abort()
    throw ex
  }
}

export function sendErrorInTx(subscriber: Subscriber<any>, err: Error): void {
  try {
    TX.begin()
    subscriber.error(TX, err)
    TX.consume()
  } catch (ex) {
    TX.abort()
    throw ex
  }
}

export function queueToEndOfTx(op: Operation): void {
  if (__DEVELOPER__) {
    assert(TX.running, "** BUG ** No transaction running")
    assert(op.priority === MAX_PRIORITY, "** BUG ** End-of-tx operations must have MAX_PRIORITY")
  }
  let tx = TX
  while (tx.parent !== null) tx = tx.parent
  tx.queue(op)
}

export interface InvokeableWithParam<P> {
  invoke(p: P): void
}

export interface InvokeableWithoutParam {
  invoke(): void
}

export type Invokeable<P> = P extends undefined ? InvokeableWithoutParam : InvokeableWithParam<P>

export function invoke(invokeable: InvokeableWithoutParam): Task {
  return new InvokeWithoutParam(invokeable)
}

export function invokeWith<T>(invokeable: InvokeableWithParam<T>, param: T): Task {
  return new InvokeWithParam(invokeable, param)
}

class InvokeWithParam<P> implements Task {
  constructor(private i: InvokeableWithParam<P>, private p: P) {}
  public run(): void {
    this.i.invoke(this.p)
  }
}

class InvokeWithoutParam implements Task {
  constructor(private i: InvokeableWithoutParam) {}
  public run(): void {
    this.i.invoke()
  }
}
