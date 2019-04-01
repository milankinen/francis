import { checkObservable } from "../_check"
import { NOOP_SUBSCRIBER, Source } from "../_core"
import { In, Out } from "../_interfaces"
import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { curry2 } from "../_util"
import { dispatcherOf, Observable } from "../Observable"
import { Pipe, PipeSubscriber } from "./_base"
import { JoinOperator } from "./_join"
import { SVSource } from "./sample"
import { toEventStream } from "./toEventStream"

export const skipUntil: CurriedSkipUntil = curry2(_skipUntil)
export interface CurriedSkipUntil {
  <ObsType, ValueType>(trigger: Observable<any>, observable: In<ObsType, ValueType>): Out<
    ObsType,
    ValueType
  >
  <ValueType>(trigger: Observable<any>): <ObsType>(
    observable: In<ObsType, ValueType>,
  ) => Out<ObsType, ValueType>
}

function _skipUntil<T>(trigger: Observable<any>, observable: Observable<T>): Observable<T> {
  checkObservable(trigger)
  return makeObservable(
    observable,
    new SkipUntil(dispatcherOf(toEventStream(trigger)), dispatcherOf(observable)),
  )
}

class SkipUntil<T> extends JoinOperator<T, T> implements PipeSubscriber<any> {
  protected source!: SVSource<T, any>
  private pass: boolean = false

  constructor(vSrc: Source<any>, sSrc: Source<T>) {
    super(new SVSource(vSrc, sSrc, NOOP_SUBSCRIBER))
    this.source.vDest = new Pipe(this)
  }

  public next(tx: Transaction, val: T): void {
    this.forkNext(tx, val)
  }

  public joinNext(tx: Transaction, val: T): void {
    this.pass && this.sink.next(tx, val)
  }

  public pipedNext(sender: Pipe<any>, tx: Transaction, v: any): void {
    this.pass = true
    this.source.disposeValue()
  }

  public pipedError(sender: Pipe<any>, tx: Transaction, err: Error): void {
    // trigger errors are ignored
  }

  public pipedEnd(sender: Pipe<any>, tx: Transaction): void {
    this.source.disposeValue()
  }
}
