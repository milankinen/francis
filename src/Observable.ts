import { Dispatcher } from "./_dispatcher"

export abstract class Observable<A> {
  constructor(public src: Dispatcher<A>) {}
}
