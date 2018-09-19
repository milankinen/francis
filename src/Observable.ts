import { Dispatcher } from "./_dispatcher"
import { DISPATCHER, observable } from "./_symbols"

export abstract class Observable<A> {
  public [DISPATCHER]: Dispatcher<A>

  constructor(d: Dispatcher<A>) {
    this[DISPATCHER] = d
  }

  public [observable]() {
    throw new Error("Not implemented")
  }
}

export function dispatcherOf<T>(obs: Observable<T>): Dispatcher<T> {
  return obs[DISPATCHER]
}
