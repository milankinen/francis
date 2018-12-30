import { checkFunction } from "../_check"
import { Source, Subscriber, Subscription } from "../_core"
import { isObservable, makeEventStream } from "../_obs"
import { Transaction } from "../_tx"
import { EventStream } from "../EventStream"
import { dispatcherOf, Observable } from "../Observable"
import { MultiSourceNode } from "../operators/_multisource"
import { Concat } from "../operators/concat"
import { never } from "./never"

/**
 * Generator type for `F.repeat`
 * @see repeat
 *
 * @public
 */
export type Generator<ValueType> = (
  i: number,
) => Observable<ValueType> | "" | false | null | undefined | 0

/**
 * Calls generator function which is expected to return an observable. When the spawned
 * observable ends, the generator is called again to spawn a new observable. If generator
 * returns a falsy value, the stream ends.
 *
 * @param generator - Generator function that's supposed to return an observable or `null` to end the stream
 * @returns An EventStream containing values and errors from the spawned observable.
 * @see Generator
 *
 * @example
 *
 * const events = F.repeat(i => i < 10 && F.fromArray([...Array(i).keys()].map(_ => i)))
 *
 * @public
 */
export function repeat<ValueType>(generator: Generator<ValueType>): EventStream<ValueType> {
  checkFunction(generator)
  return makeEventStream(new Repeat(generator))
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
