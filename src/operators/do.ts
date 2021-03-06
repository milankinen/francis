import { checkFunction } from "../_check"
import { Source } from "../_core"
import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { curry2 } from "../_util"
import { dispatcherOf, Observable } from "../Observable"
import { Identity } from "./_base"
import { map } from "./map"

export interface DoActionOp {
  <T>(f: (val: T) => void, observable: Observable<T>): Observable<T>
  <T>(f: (val: T) => void): (observable: Observable<T>) => Observable<T>
}

export interface DoErrorOp {
  <T>(f: (err: Error) => void, observable: Observable<T>): Observable<T>
  <T>(f: (err: Error) => void): (observable: Observable<T>) => Observable<T>
}

export interface DoEndOp {
  <T>(f: () => void, observable: Observable<T>): Observable<T>
  <T>(f: () => void): (observable: Observable<T>) => Observable<T>
}

export interface DoLogOp {
  <T>(label: string | undefined, observable: Observable<T>): Observable<T>
  <T>(label: string | undefined): (observable: Observable<T>) => Observable<T>
}

export const doAction: DoActionOp = curry2(_doAction)
export const doError: DoErrorOp = curry2(_doError)
export const doEnd: DoEndOp = curry2(_doEnd)
export const doLog: DoLogOp = curry2(_doLog)

function _doAction<T>(f: (val: T) => void, observable: Observable<T>): Observable<T> {
  checkFunction(f)
  const eff = (val: T): T => {
    f(val)
    return val
  }
  return map(eff, observable)
}

function _doError<T>(f: (err: Error) => void, observable: Observable<T>): Observable<T> {
  checkFunction(f)
  return makeObservable(observable, new DoError(dispatcherOf(observable), f))
}

function _doEnd<T>(f: () => void, observable: Observable<T>): Observable<T> {
  checkFunction(f)
  return makeObservable(observable, new DoEnd(dispatcherOf(observable), f))
}

function _doLog<T>(label: string | undefined, observable: Observable<T>): Observable<T> {
  return makeObservable(observable, new DoLog(dispatcherOf(observable), label))
}

class DoError<T> extends Identity<T> {
  constructor(src: Source<T>, private f: (err: Error) => void) {
    super(src)
  }

  public error(tx: Transaction, err: Error): void {
    const { f } = this
    f(err)
    this.sink.error(tx, err)
  }
}

class DoEnd<T> extends Identity<T> {
  constructor(src: Source<T>, private f: () => void) {
    super(src)
  }

  public end(tx: Transaction): void {
    const { f } = this
    f()
    this.sink.end(tx)
  }
}

class DoLog<T> extends Identity<T> {
  constructor(src: Source<T>, private label: string | undefined) {
    super(src)
  }

  public next(tx: Transaction, val: T): void {
    this.log(val)
    this.sink.next(tx, val)
  }

  public error(tx: Transaction, err: Error): void {
    this.log("<error>", err)
    this.sink.error(tx, err)
  }

  public end(tx: Transaction): void {
    this.log("<end>")
    this.sink.end(tx)
  }

  private log(...msgs: any[]): void {
    const args: any[] = this.label === undefined ? msgs : [this.label, ...msgs]
    // tslint:disable-next-line:no-console
    console.log(...args)
  }
}
