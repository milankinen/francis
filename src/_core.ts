import { Transaction } from "./_tx"
import { Scheduler, Task } from "./scheduler/index"

export interface Subscriber<T> {
  begin(): boolean

  next(tx: Transaction, val: T): void

  error(tx: Transaction, err: Error): void

  end(tx: Transaction): void
}

export interface Subscription {
  dispose(): void

  reorder(order: number): void
}

export interface Source<T> {
  readonly weight: number
  subscribe(scheduler: Scheduler, subscriber: Subscriber<T>, order: number): Subscription
}

// tslint:disable-next-line:no-shadowed-variable
export const NONE = new class NONE {}() as any

export const NOOP_SUBSCRIBER = new class NoopSubscriber implements Subscriber<any> {
  public begin(): boolean {
    return false
  }
  public next(tx: Transaction, val: any): void {}
  public error(tx: Transaction, err: Error): void {}
  public end(tx: Transaction): void {}
}()

export const NOOP_SUBSCRIPTION = new class NoopSubscription implements Subscription {
  public dispose(): void {}
  public reorder(order: number): void {}
}()

export function sendRootNext<T>(subscriber: Subscriber<T>, val: T): void {
  const tx = new Transaction()
  sendNextSafely(tx, subscriber, val)
  tx.executePending()
}

export function sendRootEnd(subscriber: Subscriber<any>): void {
  const tx = new Transaction()
  sendEndSafely(tx, subscriber)
  tx.executePending()
}

export function sendRootError(subscriber: Subscriber<any>, err: Error): void {
  const tx = new Transaction()
  sendErrorSafely(tx, subscriber, err)
  tx.executePending()
}

export function sendNextSafely<T>(tx: Transaction, s: Subscriber<T>, val: T): void {
  try {
    s.next(tx, val)
  } catch (err) {
    s.error(tx, err)
  }
}

export function sendErrorSafely<T>(tx: Transaction, s: Subscriber<T>, err: Error): void {
  // TODO: try-catch
  s.error(tx, err)
}

export function sendEndSafely<T>(tx: Transaction, s: Subscriber<T>): void {
  // TODO: try-catch
  s.end(tx)
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
