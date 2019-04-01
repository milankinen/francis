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

export const takeUntil: CurriedTakeUntil = curry2(_takeUntil)
export interface CurriedTakeUntil {
  <ObsType, ValueType>(trigger: Observable<any>, observable: In<ObsType, ValueType>): Out<
    ObsType,
    ValueType
  >
  <ValueType>(trigger: Observable<any>): <ObsType>(
    observable: In<ObsType, ValueType>,
  ) => Out<ObsType, ValueType>
}

function _takeUntil<T>(trigger: Observable<any>, observable: Observable<T>): Observable<T> {
  checkObservable(trigger)
  return makeObservable(
    observable,
    new TakeUntil(dispatcherOf(toEventStream(trigger)), dispatcherOf(observable)),
  )
}

class TakeUntil<T> extends JoinOperator<T, T> implements PipeSubscriber<any> {
  protected source!: SVSource<T, any>

  constructor(vSrc: Source<any>, sSrc: Source<T>) {
    super(new SVSource(vSrc, sSrc, NOOP_SUBSCRIBER))
    this.source.vDest = new Pipe(this)
  }

  public next(tx: Transaction, val: T): void {
    this.forkNext(tx, val)
  }

  public pipedNext(sender: Pipe<any>, tx: Transaction, v: any): void {
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
