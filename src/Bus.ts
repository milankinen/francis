import { __DEVBUILD__, assert, GENERIC_ERROR_MSG } from "./_assert"
import { checkObservable } from "./_check"
import { invoke, InvokeableWithoutParam } from "./_core"
import { AnyEvent, Dispose } from "./_interfaces"
import { mutable, MutableSource } from "./_mutable"
import { curry2, is, isFunction, noop } from "./_util"
import { EventStream, EventStreamDispatcher } from "./EventStream"
import { Observable } from "./Observable"
import { subscribe } from "./operators/subscribe"
import { scheduleActivationTask } from "./scheduler/index"

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

export interface PlugOp {
  <T>(bus: Bus<T>, obs: Observable<T>): Dispose
  <T>(bus: Bus<T>): (bs: Observable<T>) => Dispose
}

export const push: PushOp = curry2(_push)
export const pushNext: PushNextOp = curry2(_pushNext)
export const pushError: PushErrorOp = curry2(_pushError)
export const pushEnd = _pushEnd
export const plug: PlugOp = curry2(_plug)

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

function _plug<T>(bus: Bus<T>, obs: Observable<T>): Dispose {
  if (__DEVBUILD__) {
    checkBus(bus)
    checkObservable(obs)
  }
  return (mutable(bus) as BusSource<T>).plug(obs)
}

export class Bus<T> extends EventStream<T> {
  constructor() {
    super(new EventStreamDispatcher(new BusSource()))
  }
}

class BusSource<T> extends MutableSource<T> implements InvokeableWithoutParam {
  private plugged: Array<PluggedEntry<T>> = []

  public activate(initialNeeded: boolean): void {
    super.activate(initialNeeded)
    if (this.plugged.length > 0) {
      scheduleActivationTask(invoke(this))
    }
  }

  public invoke(): void {
    if (this.active && !this.ended) {
      this.plugged.forEach(entry => this.follow(entry))
    }
  }

  public dispose(): void {
    super.dispose()
    this.plugged.forEach(entry => this.unfollow(entry))
  }

  public plug(obs: Observable<T>): Dispose {
    if (this.ended) {
      return noop
    } else {
      const bus = this
      const entry: PluggedEntry<T> = { obs }
      bus.plugged.push(entry)
      if (this.active) {
        this.follow(entry)
      }
      return function unplug() {
        const idx = bus.plugged.indexOf(entry)
        idx >= 0 && bus.plugged.splice(idx, 1)
        bus.unfollow(entry)
      }
    }
  }

  private follow(entry: PluggedEntry<T>): void {
    if (!isFunction(entry.dispose)) {
      entry.dispose = subscribe(event => {
        if (!event.isEnd) {
          // TODO: should we ignore errors as well? check from bacon sources
          this.send(event)
        }
      }, entry.obs)
    }
  }

  private unfollow(entry: PluggedEntry<T>): void {
    const { dispose } = entry
    entry.dispose = void 0
    if (isFunction(dispose)) {
      dispose()
    }
  }
}

interface PluggedEntry<T> {
  obs: Observable<T>
  dispose?: Dispose
}

function checkBus(x: any): void {
  const ok = is(x, Bus)
  assert(ok, __DEVBUILD__ ? (!ok ? `Expected a Bus but got ${x}` : "") : GENERIC_ERROR_MSG)
}
