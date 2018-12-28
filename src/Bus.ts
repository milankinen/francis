import { __DEVBUILD__, assert, GENERIC_ERROR_MSG } from "./_assert"
import { AnyEvent } from "./_interfaces"
import { mutable, MutableSource } from "./_mutable"
import { curry2, is } from "./_util"
import { EventStream, EventStreamDispatcher } from "./EventStream"

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
export const pushEnd = _pushEnd

function _push<T>(bus: Bus<T>, event: T | AnyEvent<T>): void {
  if (__DEVBUILD__) {
    checkBus(bus)
  }
  mutable(bus).send(event)
}

function _pushNext<T>(bus: Bus<T>, val: T): void {
  if (__DEVBUILD__) {
    checkBus(bus)
  }
  mutable(bus).sendNext(val)
}

function _pushError(bus: Bus<any>, err: Error): void {
  if (__DEVBUILD__) {
    checkBus(bus)
  }
  mutable(bus).sendError(err)
}

function _pushEnd(bus: Bus<any>): void {
  if (__DEVBUILD__) {
    checkBus(bus)
  }
  mutable(bus).sendEnd()
}

export class Bus<T> extends EventStream<T> {
  constructor() {
    super(new EventStreamDispatcher(new MutableSource()))
  }
}

function checkBus(x: any): void {
  const ok = is(x, Bus)
  assert(ok, __DEVBUILD__ ? (!ok ? `Expected a Bus but got ${x}` : "") : GENERIC_ERROR_MSG)
}
