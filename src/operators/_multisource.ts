import { __DEVBUILD__ } from "../_assert"
import { checkObservable } from "../_check"
import {
  EndStateAware,
  invoke,
  InvokeableWithoutParam,
  NOOP_SUBSCRIBER,
  NOOP_SUBSCRIPTION,
  sendEndInTx,
  Source,
  Subscriber,
  Subscription,
} from "../_core"
import { makeStatefulEventStream } from "../_obs"
import { Transaction } from "../_tx"
import { EventStream } from "../EventStream"
import { Observable } from "../Observable"
import { scheduleActivationTask } from "../scheduler/index"
import { never } from "../sources/never"
import { Identity } from "./_base"
import { toEventStream } from "./toEventStream"

export function makeMultiSourceStream<T>(
  observables: Array<Observable<T>>,
  ctor: MultiSourceCtor<T>,
): EventStream<T> {
  if (__DEVBUILD__) {
    observables.forEach(checkObservable)
  }
  if (observables.length === 0) {
    observables = [never()]
  }
  return makeStatefulEventStream(
    new MSIdentity(new ctor(observables.map(o => toEventStream(o).src))),
  )
}

export interface MultiSourceCtor<T> {
  new (sources: Array<Source<T>>): MultiSource<T> & EndStateAware
}

export class MSIdentity<T> extends Identity<T> implements EndStateAware {
  protected source!: MultiSource<T>

  constructor(source: MultiSource<T>) {
    super(source)
  }

  public isEnded(): boolean {
    return this.source.isEnded()
  }
}

export abstract class MultiSource<T>
  implements Source<T>, Subscription, InvokeableWithoutParam, EndStateAware {
  public readonly weight: number
  protected head: MultiSourceNode<T> | null
  protected sink: Subscriber<T> = NOOP_SUBSCRIBER
  protected active: boolean = false
  protected ord: number = -1

  constructor(sources: Array<Source<T>>, protected concurrency: number) {
    this.weight = sources.reduce((w, s) => w + s.weight, 0)
    let tail = (this.head = new MultiSourceNode(this, sources[0], null, null))
    for (let i = 1; i < sources.length; i++) {
      tail = tail.t = new MultiSourceNode(this, sources[i], tail, null)
    }
  }

  public isEnded(): boolean {
    return this.head === null
  }

  public subscribe(subscriber: Subscriber<T>, order: number): Subscription {
    this.sink = subscriber
    this.ord = order
    let { head, concurrency } = this
    while (concurrency-- && head !== null) {
      head.subscribe(order)
      head = head.t
    }
    return this
  }

  public activate(initialNeeded: boolean): void {
    let { head, concurrency } = this
    this.active = true
    if (head === null) {
      scheduleActivationTask(invoke(this))
    } else {
      while (concurrency-- && head !== null && this.active) {
        head.activate(initialNeeded)
        head = head.t
      }
    }
  }

  public dispose(): void {
    let { head, concurrency } = this
    this.active = false
    this.sink = NOOP_SUBSCRIBER
    while (concurrency-- && head !== null) {
      head.dispose()
      head = head.t
    }
  }

  public reorder(order: number): void {
    let { head, concurrency } = this
    this.active = false
    this.ord = order
    while (concurrency-- && head !== null && this.active) {
      head.subs.reorder(order)
      head = head.t
    }
  }

  public invoke(): void {
    this.active && sendEndInTx(this.sink)
  }

  public mNext(tx: Transaction, val: T): void {
    this.sink.next(tx, val)
  }

  public mError(tx: Transaction, err: Error): void {
    this.sink.error(tx, err)
  }

  public abstract mEnd(tx: Transaction, node: MultiSourceNode<T>): void
}

export class MultiSourceNode<T> implements Subscriber<T> {
  public subs: Subscription = NOOP_SUBSCRIPTION
  constructor(
    public m: MultiSource<T>,
    public src: Source<T>,
    public h: MultiSourceNode<T> | null,
    public t: MultiSourceNode<T> | null,
  ) {}

  public subscribe(order: number): void {
    this.subs = this.src.subscribe(this, order)
  }

  public activate(initialNeeded: boolean): void {
    this.subs.activate(initialNeeded)
  }

  public dispose(): void {
    const { subs } = this
    this.subs = NOOP_SUBSCRIPTION
    subs.dispose()
  }

  public next(tx: Transaction, val: T): void {
    this.m.mNext(tx, val)
  }

  public error(tx: Transaction, err: Error): void {
    this.m.mError(tx, err)
  }

  public end(tx: Transaction): void {
    this.m.mEnd(tx, this)
  }
}
