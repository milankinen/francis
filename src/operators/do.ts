import { Source } from "../_core"
import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { EventStream } from "../EventStream"
import { Observable } from "../Observable"
import { Property } from "../Property"
import { Identity } from "./_base"
import { map } from "./map"

export function doAction<T>(f: (val: T) => void, observable: Property<T>): Property<T>
export function doAction<T>(f: (val: T) => void, observable: EventStream<T>): EventStream<T>
export function doAction<T>(f: (val: T) => void, observable: Observable<T>): Observable<T>
export function doAction<T>(f: (val: T) => void, observable: Observable<T>): Observable<T> {
  const eff = (val: T): T => {
    f(val)
    return val
  }
  return map(eff, observable)
}

export function doError<T>(f: (err: Error) => void, observable: Property<T>): Property<T>
export function doError<T>(f: (err: Error) => void, observable: EventStream<T>): EventStream<T>
export function doError<T>(f: (err: Error) => void, observable: Observable<T>): Observable<T>
export function doError<T>(f: (err: Error) => void, observable: Observable<T>): Observable<T> {
  return makeObservable(observable, new DoError(observable.src, f))
}

export function doEnd<T>(f: () => void, observable: Property<T>): Property<T>
export function doEnd<T>(f: () => void, observable: EventStream<T>): EventStream<T>
export function doEnd<T>(f: () => void, observable: Observable<T>): Observable<T>
export function doEnd<T>(f: () => void, observable: Observable<T>): Observable<T> {
  return makeObservable(observable, new DoEnd(observable.src, f))
}

export function doLog<T>(label: string | undefined, observable: Property<T>): Property<T>
export function doLog<T>(label: string | undefined, observable: EventStream<T>): EventStream<T>
export function doLog<T>(label: string | undefined, observable: Observable<T>): Observable<T>
export function doLog<T>(label: string | undefined, observable: Observable<T>): Observable<T> {
  return makeObservable(observable, new DoLog(observable.src, label))
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
    // tslint:disable-next-line:no-console
    console.log.apply(console, this.label === undefined ? msgs : [this.label, ...msgs])
  }
}
