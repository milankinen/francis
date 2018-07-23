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
import { isArray } from "../_util"
import * as Event from "../Event"
import { Observable } from "../Observable"
import { Eff, runEffects } from "./_eff"

export function subscribe<T>(f: Handler<T>, observable: Observable<T>): Dispose {
  const s = new Subscribe(f)
  runEffects(s, observable)
  return function dispose(): void {
    s.dispose()
  }
}

export function onValue<T>(f: ValueHandler<T>, observable: Observable<T>): Dispose {
  return subscribe(e => Event.isNext(e) && f(e.value), observable)
}

export function onValues<T>(f: ValuesHandler<T>, observable: Observable<T[]>): Dispose {
  const unfold = (vals: T[]) => (isArray(vals) ? f(...vals) : f(vals as any))
  return onValue(unfold, observable)
}

export function onError(f: ErrorHandler, observable: Observable<any>): Dispose {
  return subscribe(e => Event.isError(e) && f(e.error), observable)
}

export function onEnd(f: EndHandler, observable: Observable<any>): Dispose {
  return subscribe(e => Event.isEnd(e) && f(), observable)
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
