import { __DEVBUILD__, __DEVELOPER__, assert } from "./_assert"
import {
  isInTx,
  NOOP_SUBSCRIBER,
  queueToEndOfTx,
  sendEndInTx,
  sendErrorInTx,
  sendNextInTx,
  Source,
  Subscriber,
  Subscription,
} from "./_core"
import { AnyEvent } from "./_interfaces"
import { MAX_PRIORITY } from "./_priority"
import { Operation, Transaction } from "./_tx"
import * as Event from "./Event"
import { dispatcherOf, Observable } from "./Observable"

export function mutable<T>(o: Observable<T>): MutableSource<T> {
  const src = (dispatcherOf(o) as any).source as MutableSource<T>
  if (__DEVELOPER__) {
    assert(src instanceof MutableSource, "** BUG ** Not a mutable source")
  }
  return src
}

export class MutableSource<T> implements Source<T>, Subscription {
  public readonly weight: number = 1
  protected s: Subscriber<T> = NOOP_SUBSCRIBER
  protected active: boolean = false
  protected ended: boolean = false

  public subscribe(subscriber: Subscriber<T>, order: number): Subscription {
    this.s = subscriber
    return this
  }

  public activate(initialNeeded: boolean): void {
    this.active = true
    if (this.ended) {
      sendEndInTx(this.s)
    }
  }

  public dispose(): void {
    this.active = false
    this.s = NOOP_SUBSCRIBER
  }

  public reorder(order: number): void {
    // noop
  }

  public sendOk(): boolean {
    return this.active && !this.ended
  }

  public send(event: T | AnyEvent<T>): void {
    if (Event.isEvent(event)) {
      if (Event.isNext(event)) {
        this.sendNext(event.value)
      } else if (Event.isError(event)) {
        this.sendError(event.error)
      } else {
        this.sendEnd()
      }
    } else {
      this.sendNext(event)
    }
  }

  public sendNext(val: T): void {
    if (this.sendOk()) {
      if (isInTx()) {
        queueToEndOfTx(new SendNext(this, val))
      } else {
        sendNextInTx(this.s, val)
      }
    }
  }

  public sendError(err: Error): void {
    if (this.sendOk()) {
      if (isInTx()) {
        queueToEndOfTx(new SendError(this, err))
      } else {
        sendErrorInTx(this.s, err)
      }
    }
  }

  public sendEnd(): void {
    if (this.sendOk()) {
      this.ended = true
      if (isInTx()) {
        queueToEndOfTx(new SendEnd(this, undefined))
      } else {
        sendEndInTx(this.s)
      }
    } else {
      this.ended = true
    }
  }

  public _next(tx: Transaction, val: T): void {
    this.sendOk() && this.s.next(tx, val)
  }

  public _error(tx: Transaction, err: Error): void {
    this.sendOk() && this.s.error(tx, err)
  }

  public _end(tx: Transaction): void {
    this.active && this.s.end(tx)
  }
}

abstract class Send<T, V> implements Operation {
  public readonly priority: number = MAX_PRIORITY
  constructor(protected m: MutableSource<T>, protected v: V) {}
  public abstract exec(tx: Transaction): void
  public abort(): void {}
}

class SendNext<T> extends Send<T, T> {
  public exec(tx: Transaction): void {
    this.m._next(tx, this.v)
  }
}

class SendError<T> extends Send<T, Error> {
  public exec(tx: Transaction): void {
    this.m._error(tx, this.v)
  }
}

class SendEnd<T> extends Send<T, undefined> {
  public exec(tx: Transaction): void {
    this.m._end(tx)
  }
}
