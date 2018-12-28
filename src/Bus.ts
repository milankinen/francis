import { __DEVBUILD__, assert, GENERIC_ERROR_MSG } from "./_assert"
import {
  EndStateAware,
  isInTx,
  NOOP_SUBSCRIPTION,
  queueToTx,
  sendEndInTx,
  sendErrorInTx,
  sendNextInTx,
  Source,
  Subscriber,
  Subscription,
} from "./_core"
import { MCSNode } from "./_dispatcher"
import { AnyEvent } from "./_interfaces"
import { MAX_PRIORITY } from "./_priority"
import { Operation, Transaction } from "./_tx"
import { curry2 } from "./_util"
import * as Event from "./Event"
import { EventStream, StatfulEventStreamDispatcher } from "./EventStream"
import { dispatcherOf } from "./Observable"

export interface PushOp {
  <T>(bus: Bus<T>, event: T | AnyEvent<T>): void
  <T>(bus: Bus<T>): (event: T | AnyEvent<T>) => void
}

export interface PushNextOp {
  <T>(bus: Bus<T>, val: T): void
  <T>(bus: Bus<T>): (val: T) => void
}

export interface PushErrorOp {
  (bus: Bus<any>, err: Error): void
  (bus: Bus<any>): (err: Error) => void
}

export const push: PushOp = curry2(_push)
export const pushNext: PushNextOp = curry2(_pushNext)
export const pushError: PushErrorOp = curry2(_pushError)

export function pushEnd(bus: Bus<any>): void {
  if (__DEVBUILD__) {
    checkBus(bus)
  }
  busDispatcher(bus).sendEnd()
}

function _push<T>(bus: Bus<T>, event: T | AnyEvent<T>): void {
  if (__DEVBUILD__) {
    checkBus(bus)
  }
  busDispatcher(bus).send(event)
}

function _pushNext<T>(bus: Bus<T>, val: T): void {
  if (__DEVBUILD__) {
    checkBus(bus)
  }
  busDispatcher(bus).sendNext(val)
}

function _pushError(bus: Bus<any>, err: Error): void {
  if (__DEVBUILD__) {
    checkBus(bus)
  }
  busDispatcher(bus).sendError(err)
}

export class Bus<T> extends EventStream<T> {
  constructor() {
    super(new BusDispatcher(new BusSource()))
  }
}

class BusDispatcher<T> extends StatfulEventStreamDispatcher<T> {
  protected source!: BusSource<T>

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
    if (this.isSendOk()) {
      if (isInTx()) {
        queueToTx(new SendNextOp(this, val), this.ord)
      } else {
        sendNextInTx(this.sink, val)
      }
    }
  }

  public sendError(err: Error): void {
    if (this.isSendOk()) {
      if (isInTx()) {
        queueToTx(new SendErrorOp(this, err), this.ord)
      } else {
        sendErrorInTx(this.sink, err)
      }
    }
  }

  public sendEnd(): void {
    this.source.markEnded()
    if (this.active) {
      if (isInTx()) {
        queueToTx(new SendEndOp(this, null), this.ord)
      } else {
        sendEndInTx(this.sink)
      }
    }
  }

  public reorder(order: number): void {
    // normally we'd be interested in bigger order but for buses, we need to know the
    // smallest order on order to defer event sending to correct transaction, hence
    // we're overriding the default behaviour here
    if (this.ord === -1 || this.ord > order) {
      this.ord = order
    }
  }

  public next(tx: Transaction, val: T): void {
    if (this.isSendOk()) {
      this.sink.next(tx, val)
    }
  }

  public error(tx: Transaction, err: Error): void {
    if (this.isSendOk()) {
      this.sink.error(tx, err)
    }
  }

  public end(tx: Transaction): void {
    if (this.active) {
      this.sink.end(tx)
    }
  }

  protected isSendOk(): boolean {
    return this.active && !this.source.isEnded()
  }

  protected removeNode(node: MCSNode<T>): { order: number; next: Subscriber<T> } {
    return this.msc.removeReturnMinOrder(node)
  }

  protected reorderAfterRemoval(order: number): void {
    this.ord = order
  }

  protected markEnded(): void {
    this.source.markEnded()
  }
}

class BusSource<T> implements Source<T>, EndStateAware {
  public readonly weight: number = 0
  private ended: boolean = false
  public subscribe(subscriber: Subscriber<T>, order: number): Subscription {
    return NOOP_SUBSCRIPTION
  }
  public isEnded(): boolean {
    return this.ended
  }
  public markEnded(): void {
    this.ended = true
  }
}

abstract class SendOp<T, V> implements Operation {
  public readonly priority: number = MAX_PRIORITY
  constructor(protected d: BusDispatcher<T>, protected v: V) {}
  public abstract exec(tx: Transaction): void
  public abort(): void {}
}

class SendNextOp<T> extends SendOp<T, T> {
  public exec(tx: Transaction): void {
    this.d.next(tx, this.v)
  }
}

class SendErrorOp<T> extends SendOp<T, Error> {
  public exec(tx: Transaction): void {
    this.d.error(tx, this.v)
  }
}

class SendEndOp<T> extends SendOp<T, null> {
  public exec(tx: Transaction): void {
    this.d.end(tx)
  }
}

function checkBus(x: any): void {
  const ok = is(x, Bus)
  assert(ok, __DEVBUILD__ ? (!ok ? `Expected a Bus but got ${x}` : "") : GENERIC_ERROR_MSG)
}

function busDispatcher<T>(bus: Bus<T>): BusDispatcher<T> {
  return dispatcherOf(bus) as BusDispatcher<T>
}
