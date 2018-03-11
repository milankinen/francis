import { Transaction } from "./_tx"
import { Scheduler } from "./scheduler/index"

export interface Subscriber<T> {
  isActive(): boolean

  initial(tx: Transaction, val: T): void

  noinitial(tx: Transaction): void

  event(tx: Transaction, val: T): void

  error(tx: Transaction, err: Error): void

  end(tx: Transaction): void
}

export interface Subscription {
  dispose(): void

  reorder(order: number): void
}

export interface Source<T> {
  weight: number

  subscribe(scheduler: Scheduler, subscriber: Subscriber<T>, order: number): Subscription
}

export const NONE = {} as any

export const NOOP_SUBSCRIBER = new class NoopSubscriber implements Subscriber<any> {
  public isActive(): boolean {
    return false
  }
  public initial(tx: Transaction, val: any): void {}
  public noinitial(tx: Transaction): void {}
  public event(tx: Transaction, val: any): void {}
  public error(tx: Transaction, err: Error): void {}
  public end(tx: Transaction): void {}
}()

export const NOOP_SUBSCRIPTION = new class NoopSubscription implements Subscription {
  public dispose(): void {}
  public reorder(order: number): void {}
}()

const txStack = [new Transaction()]
let txRoot = txStack[0]

export function txPush(): void {
  txStack.push(new Transaction())
  txRoot = txStack[txStack.length - 1]
}

export function txPop(): void {
  txStack.pop()
  txRoot = txStack[txStack.length - 1]
}

export function sendRootInitial<T>(subscriber: Subscriber<T>, val: T): void {
  sendInitialSafely(txRoot, subscriber, val)
  txRoot.executePending()
}

export function sendRootNoInitial<T>(subscriber: Subscriber<T>): void {
  sendNoInitialSafely(txRoot, subscriber)
  txRoot.executePending()
}

export function sendRootEvent<T>(subscriber: Subscriber<T>, val: T): void {
  sendEventSafely(txRoot, subscriber, val)
  txRoot.executePending()
}

export function sendRootEnd(subscriber: Subscriber<any>): void {
  sendEndSafely(txRoot, subscriber)
  txRoot.executePending()
}

export function sendRootError(subscriber: Subscriber<any>, err: Error): void {
  sendErrorSafely(txRoot, subscriber, err)
  txRoot.executePending()
}

export function sendInitialSafely<T>(tx: Transaction, s: Subscriber<T>, val: T): void {
  try {
    s.initial(tx, val)
  } catch (err) {
    s.error(tx, err)
  }
}

export function sendNoInitialSafely<T>(tx: Transaction, s: Subscriber<T>): void {
  s.noinitial(tx)
}

export function sendEventSafely<T>(tx: Transaction, s: Subscriber<T>, val: T): void {
  try {
    s.event(tx, val)
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
