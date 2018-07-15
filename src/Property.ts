import { NONE, sendRootEnd, sendRootNext, Subscriber } from "./_core"
import { Dispatcher } from "./_dispatcher"
import { Transaction } from "./_tx"
import { Observable } from "./Observable"

export class Property<A> extends Observable<A> {
  constructor(src: PropertyDispatcher<A>) {
    super(src)
  }
}

export function isProperty<T>(x: any): x is Property<T> {
  return x && x instanceof Property
}

export class PropertyDispatcher<T> extends Dispatcher<T> {
  private val: T = NONE
  private ended: boolean = false

  public activate(subscriber: Subscriber<T>): void {
    this.replayState(subscriber)
    super.activate(subscriber)
  }

  public begin(): boolean {
    return !this.ended && this.sink.begin()
  }

  public next(tx: Transaction, val: T): void {
    this.sink.next(tx, (this.val = val))
  }

  public end(tx: Transaction): void {
    this.ended = true
    this.sink.end(tx)
  }

  // invoked when state must be replayed
  private replayState(subscriber: Subscriber<T>): void {
    const { val, ended } = this
    const hasVal = val !== NONE
    if ((hasVal || ended) && this.sink.begin()) {
      hasVal && sendRootNext(subscriber, val)
      ended === true && sendRootEnd(subscriber)
    }
  }
}
