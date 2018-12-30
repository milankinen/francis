import { Subscriber } from "../_core"
import { makeEventStream } from "../_obs"
import { EventStream } from "../EventStream"
import { Activation, Root } from "./_base"

/**
 * Creates an EventStream that immediately ends
 *
 * @example
 *
 * const emptyNum = F.never<number>()
 *
 * @public
 */
export function never<ValueType>(): EventStream<ValueType> {
  return makeEventStream(new Never<ValueType>())
}

export class Never<T> extends Root<T> {
  constructor() {
    super(false)
  }

  protected create(subscriber: Subscriber<T>): Activation<T, Never<T>> {
    return new NeverActivation(this, subscriber)
  }
}

class NeverActivation<T> extends Activation<T, Never<T>> {
  protected start(): void {
    this.sendEnd()
  }
  protected stop(): void {}
}
