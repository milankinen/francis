import { Source } from "../_core"
import { Projection } from "../_interfaces"
import { toObservable } from "../_interrop"
import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { EventStream } from "../EventStream"
import { Observable } from "../Observable"
import { Property } from "../Property"
import { once } from "../sources/single"
import { Operator } from "./_base"
import { flatMap } from "./flatMap"

export function flatMapError<T>(
  project: Projection<Error, T | Observable<T>>,
  stream: EventStream<T>,
): EventStream<T>
export function flatMapError<T>(
  project: Projection<Error, T | Observable<T>>,
  property: Property<T>,
): Property<T>
export function flatMapError<T>(
  project: Projection<Error, T | Observable<T>>,
  observable: Observable<T>,
): Observable<T>
export function flatMapError<T>(
  project: Projection<Error, T | Observable<T>>,
  observable: Observable<T>,
): Observable<T> {
  return flatMap<M<T>, T>(unpack, makeObservable(observable, new MapM(observable.src, project)))
}

class MapM<T> extends Operator<T, M<T>> {
  constructor(source: Source<T>, private p: Projection<Error, T | Observable<T>>) {
    super(source)
  }

  public next(tx: Transaction, val: T): void {
    this.sink.next(tx, new ValM(val))
  }

  public error(tx: Transaction, err: Error): void {
    this.sink.next(tx, new ErrM(err, this.p))
  }
}

interface M<T> {
  of(): Observable<T>
}

class ValM<T> implements M<T> {
  constructor(private v: T) {}
  public of(): Observable<T> {
    return once(this.v)
  }
}

class ErrM<T> implements M<T> {
  constructor(private e: Error, private p: Projection<Error, T | Observable<T>>) {}
  public of(): Observable<T> {
    const { e, p } = this
    return toObservable(p(e))
  }
}

function unpack<T>(m: M<T>): Observable<T> {
  return m.of()
}
