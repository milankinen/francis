import {
  AnyEvent,
  Dispose,
  EndHandler,
  ErrorHandler,
  Handler,
  ValueHandler,
  ValuesHandler,
} from "../_interfaces"
import { Transaction } from "../_tx"
import { curry2, isArray } from "../_util"
import * as Event from "../Event"
import { Observable } from "../Observable"
import { Eff, runEffects } from "./_eff"

export interface SubscribeOp {
  <T>(f: Handler<T>, observable: Observable<T>): Dispose
  <T>(f: Handler<T>): (observable: Observable<T>) => Dispose
}

export interface OnValueOp {
  <T>(f: ValueHandler<T>, observable: Observable<T>): Dispose
  <T>(f: ValueHandler<T>): (observable: Observable<T>) => Dispose
}

export interface OnValuesOp {
  <T>(f: ValuesHandler<T>, observable: Observable<T>): Dispose
  <T>(f: ValuesHandler<T>): (observable: Observable<T>) => Dispose
}

export interface OnErrorOp {
  (f: ErrorHandler, observable: Observable<any>): Dispose
  (f: ErrorHandler): (observable: Observable<any>) => Dispose
}

export interface OnEndOp {
  (f: EndHandler, observable: Observable<any>): Dispose
  (f: EndHandler): (observable: Observable<any>) => Dispose
}

export const subscribe: SubscribeOp = curry2(_subscribe)
export const onValue: OnValueOp = curry2(_onValue)
export const onValues: OnValuesOp = curry2(_onValues)
export const onError: OnErrorOp = curry2(_onError)
export const onEnd: OnEndOp = curry2(_onEnd)

function _subscribe<T>(f: Handler<T>, observable: Observable<T>): Dispose {
  const s = new Subscribe(f)
  runEffects(s, observable)
  return function dispose(): void {
    s.dispose()
  }
}

function _onValue<T>(f: ValueHandler<T>, observable: Observable<T>): Dispose {
  return _subscribe(e => Event.isNext(e) && f(e.value), observable)
}

function _onValues<T>(f: ValuesHandler<T>, observable: Observable<T[]>): Dispose {
  const unfold = (vals: T[]) => (isArray(vals) ? f(...vals) : f(vals as any))
  return _onValue(unfold, observable)
}

function _onError(f: ErrorHandler, observable: Observable<any>): Dispose {
  return _subscribe(e => Event.isError(e) && f(e.error), observable)
}

function _onEnd(f: EndHandler, observable: Observable<any>): Dispose {
  return _subscribe(e => Event.isEnd(e) && f(), observable)
}

class Subscribe<T> extends Eff<T> {
  constructor(private f: Handler<T>) {
    super()
  }

  public next(tx: Transaction, val: T): void {
    this.handleEvent(new Event.Next(val))
  }

  public error(tx: Transaction, err: Error): void {
    this.handleEvent(new Event.Error(err))
  }

  public end(tx: Transaction): void {
    this.dispose()
    this.handleEvent(new Event.End())
  }

  private handleEvent(event: AnyEvent<T>): void {
    const { f } = this
    const result = f(event)
    if (result === Event.noMore) {
      this.dispose()
    }
  }
}
