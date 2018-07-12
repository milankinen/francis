import { Transaction } from "./_tx"
import { Scheduler } from "./scheduler/index"

export interface Subscriber<T> {
  isActive(): boolean

  initial(tx: Transaction, val: T): void

  noinitial(tx: Transaction): void

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
  readonly sync: boolean

  subscribe(scheduler: Scheduler, subscriber: Subscriber<T>, order: number): Subscription
}

export abstract class Dispatcher<T> implements Subscriber<T> {
  public readonly dest: Subscriber<T> = NOOP_SUBSCRIBER

  /**
   * This hook is called every time when operator is activated (gets its first
   * subscriber). If this function returns false, operator aborts the current
   * subscription process. The impelementation may also queue tasks to the given
   * scheduler before returning.
   *
   * @param scheduler
   * @param subscriber
   */
  public beforeActivation(scheduler: Scheduler, subscriber: Subscriber<T>): boolean {
    return true
  }

  /**
   * This hook is called every time when operator is multicasted (gets a new subscriber
   * after initial activation). If this function returns false, operator aborts the current
   * subscription process. The impelementation may also queue tasks to the given
   * scheduler before returning.
   *
   * @param scheduler
   * @param subscriber
   */
  public beforeMulticast(scheduler: Scheduler, subscriber: Subscriber<T>): boolean {
    return true
  }

  public isActive(): boolean {
    return true
  }

  public initial(tx: Transaction, val: T): void {
    this.dest.initial(tx, val)
  }

  public noinitial(tx: Transaction): void {
    this.dest.noinitial(tx)
  }

  public next(tx: Transaction, val: T): void {
    this.dest.next(tx, val)
  }

  public error(tx: Transaction, err: Error): void {
    this.dest.error(tx, err)
  }

  public end(tx: Transaction): void {
    this.dest.end(tx)
  }
}

// tslint:disable-next-line:no-shadowed-variable
export const NONE = new class NONE {}() as any

export const NOOP_SUBSCRIBER = new class NoopSubscriber implements Subscriber<any> {
  public isActive(): boolean {
    return false
  }
  public initial(tx: Transaction, val: any): void {}
  public noinitial(tx: Transaction): void {}
  public next(tx: Transaction, val: any): void {}
  public error(tx: Transaction, err: Error): void {}
  public end(tx: Transaction): void {}
}()

export const NOOP_SUBSCRIPTION = new class NoopSubscription implements Subscription {
  public dispose(): void {}
  public reorder(order: number): void {}
}()

export const NOOP_DISPATCHER = new class NoopDispatcher extends Dispatcher<any> {}()

export function sendRootInitial<T>(subscriber: Subscriber<T>, val: T): void {
  const tx = new Transaction()
  sendInitialSafely(tx, subscriber, val)
  tx.executePending()
}

export function sendRootNoInitial<T>(subscriber: Subscriber<T>): void {
  const tx = new Transaction()
  sendNoInitialSafely(tx, subscriber)
  tx.executePending()
}

export function sendRootEvent<T>(subscriber: Subscriber<T>, val: T): void {
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
