import { checkObservable } from "../_check"
import { NOOP_SUBSCRIBER, Source } from "../_core"
import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { curry2 } from "../_util"
import { Observable } from "../Observable"
import { Pipe, PipeSubscriber } from "./_base"
import { JoinOperator } from "./_join"
import { SVSource } from "./sample"
import { toEventStream } from "./toEventStream"

export interface SkipUntilOp {
  <T>(trigger: Observable<any>, observable: Observable<T>): Observable<T>
  <T>(trigger: Observable<any>): (observable: Observable<T>) => Observable<T>
}

export const skipUntil: SkipUntilOp = curry2(_skipUntil)

function _skipUntil<T>(trigger: Observable<any>, observable: Observable<T>): Observable<T> {
  checkObservable(trigger)
  return makeObservable(observable, new SkipUntil(toEventStream(trigger).src, observable.src))
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
