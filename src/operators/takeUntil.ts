import { checkObservable } from "../_check"
import { EndStateAware, NOOP_SUBSCRIBER, Source } from "../_core"
import { makeStatefulObservable } from "../_obs"
import { Transaction } from "../_tx"
import { curry2 } from "../_util"
import { Observable } from "../Observable"
import { Pipe, PipeSubscriber } from "./_base"
import { JoinOperator } from "./_join"
import { SVSource } from "./sample"
import { toEventStream } from "./toEventStream"

export interface TakeUntilOp {
  <T>(trigger: Observable<any>, observable: Observable<T>): Observable<T>
  <T>(trigger: Observable<any>): (observable: Observable<T>) => Observable<T>
}

export const takeUntil: TakeUntilOp = curry2(_takeUntil)

function _takeUntil<T>(trigger: Observable<any>, observable: Observable<T>): Observable<T> {
  checkObservable(trigger)
  return makeStatefulObservable(
    observable,
    new TakeUntil(toEventStream(trigger).src, observable.src),
  )
}

class TakeUntil<T> extends JoinOperator<T, T> implements PipeSubscriber<any>, EndStateAware {
  protected source!: SVSource<T, any>
  private ended: boolean = false

  constructor(vSrc: Source<any>, sSrc: Source<T>) {
    super(new SVSource(vSrc, sSrc, NOOP_SUBSCRIBER))
    this.source.vDest = new Pipe(this)
  }

  public isEnded(): boolean {
    return this.ended
  }

  public next(tx: Transaction, val: T): void {
    this.forkNext(tx, val)
  }

  public pipedNext(sender: Pipe<any>, tx: Transaction, v: any): void {
    this.ended = true
    this.source.disposeValue()
    this.sink.end(tx)
  }

  public pipedError(sender: Pipe<any>, tx: Transaction, err: Error): void {
    // trigger errors are ignored
  }

  public pipedEnd(sender: Pipe<any>, tx: Transaction): void {
    this.source.disposeValue()
  }
}
