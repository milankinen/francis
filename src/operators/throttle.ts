import { checkNaturalInt } from "../_check"
import { NONE, sendEndInTx, sendNextInTx, Source } from "../_core"
import { In, Out } from "../_interfaces"
import { makeObservable } from "../_obs"
import { Transaction } from "../_tx"
import { curry2 } from "../_util"
import { dispatcherOf, Observable } from "../Observable"
import { OnTimeout, scheduleTimeout, Timeout } from "../scheduler/index"
import { InitialAndChanges } from "./_changes"

export const throttle: CurriedThrottle = curry2(_throttle)
export interface CurriedThrottle {
  <ObsType, ValueType>(delay: number, observable: In<ObsType, ValueType>): Out<ObsType, ValueType>
  (delay: number): <ObsType, ValueType>(
    observable: In<ObsType, ValueType>,
  ) => Out<ObsType, ValueType>
}

export const bufferingThrottle: CurriedBufferingThrottle = curry2(_bufferingThrottle)
export interface CurriedBufferingThrottle {
  <ObsType, ValueType>(minimumInterval: number, observable: In<ObsType, ValueType>): Out<
    ObsType,
    ValueType
  >
  (minimumInterval: number): <ObsType, ValueType>(
    observable: In<ObsType, ValueType>,
  ) => Out<ObsType, ValueType>
}

function _throttle<T>(delay: number, observable: Observable<T>): Observable<T> {
  checkNaturalInt(delay)
  return makeObservable(observable, new Throttle(dispatcherOf(observable), delay))
}

function _bufferingThrottle<T>(minimumInterval: number, observable: Observable<T>): Observable<T> {
  checkNaturalInt(minimumInterval)
  return makeObservable(
    observable,
    new BufferingThrottle(dispatcherOf(observable), minimumInterval),
  )
}

export abstract class ThrottleBase<T> extends InitialAndChanges<T> implements OnTimeout {
  protected to: Timeout | null = null

  constructor(source: Source<T>, protected delay: number) {
    super(source)
  }

  public dispose(): void {
    this.resetTimeout()
    super.dispose()
  }

  public nextInitial(tx: Transaction, val: T): void {
    this.sink.next(tx, val)
  }

  public abstract nextChange(tx: Transaction, val: T): void

  public abstract due(): void

  protected resetTimeout(): void {
    if (this.to !== null) {
      this.to.cancel()
      this.to = null
    }
  }

  protected ensureTimeout(): void {
    if (this.to === null) {
      this.to = scheduleTimeout(this, this.delay)
    }
  }
}

export class Throttle<T> extends ThrottleBase<T> {
  protected memo: T = NONE
  protected ended: boolean = false

  public dispose(): void {
    this.memo = NONE
    this.ended = false
    super.dispose()
  }

  public nextChange(tx: Transaction, val: T): void {
    this.memo = val
    this.ensureTimeout()
  }

  public end(tx: Transaction): void {
    this.ended = true
    if (this.to === null) {
      this.sink.end(tx)
    }
  }

  public due(): void {
    this.to = null
    sendNextInTx(this.sink, this.memo)
    this.active && this.ended && sendEndInTx(this.sink)
  }
}

class BufferingThrottle<T> extends ThrottleBase<T> {
  private buffer: T[] = []
  private ended: boolean = false

  public dispose(): void {
    this.buffer = []
    this.ended = false
    super.dispose()
  }

  public nextInitial(tx: Transaction, val: T): void {
    this.ensureTimeout()
    this.sink.next(tx, val)
  }

  public nextChange(tx: Transaction, val: T): void {
    if (this.to === null) {
      this.nextInitial(tx, val)
    } else {
      this.buffer.push(val)
    }
  }

  public end(tx: Transaction): void {
    this.ended = true
    if (this.to === null) {
      this.sink.end(tx)
    }
  }

  public due(): void {
    this.to = null
    if (this.buffer.length > 0) {
      this.ensureTimeout()
      sendNextInTx(this.sink, this.buffer.shift())
    } else if (this.ended && this.active) {
      sendEndInTx(this.sink)
    }
  }
}
