import { checkFunction } from "../_check"
import { Source, Subscriber, Subscription } from "../_core"
import { isObservable, makeStatefulEventStream } from "../_obs"
import { Transaction } from "../_tx"
import { EventStream } from "../EventStream"
import { dispatcherOf, Observable } from "../Observable"
import { MSIdentity, MultiSourceNode } from "../operators/_multisource"
import { Concat } from "../operators/concat"
import { never } from "./never"

export type Generator<T> = (i: number) => Observable<T> | "" | false | null | undefined | 0

export function repeat<T>(generator: Generator<T>): EventStream<T> {
  checkFunction(generator)
  return makeStatefulEventStream(new MSIdentity(new Repeat(generator)))
}

class Repeat<T> extends Concat<T> {
  private i: number = 0

  constructor(private g: Generator<T>) {
    super([dispatcherOf(never())])
  }

  // repeat is kind of simplified flatMap so we must do order+1 to all inner observables
  // in order to keep tx priorities correct
  public subscribe(subscriber: Subscriber<T>, order: number): Subscription {
    return super.subscribe(subscriber, order + 1)
  }

  public reorder(order: number): void {
    super.reorder(order + 1)
  }

  public mEnd(tx: Transaction, node: MultiSourceNode<T>): void {
    const { g } = this
    const next = g(this.i++)
    if (isObservable(next)) {
      this.addAfter(node, dispatcherOf(next))
    }
    super.mEnd(tx, node)
  }

  private addAfter(node: MultiSourceNode<T>, src: Source<T>): void {
    const added = new MultiSourceNode(this, src, node, null)
    node.t !== null && (node.t.h = added)
    node.t = added
  }
}
