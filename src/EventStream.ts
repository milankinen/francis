import { Dispatcher } from "./_dispatcher"
import { Observable } from "./Observable"

export class EventStream<A> extends Observable<A> {
  constructor(src: EventStreamDispatcher<A>) {
    super(src)
  }
}

export function isEventStream<T>(x: any): x is EventStream<T> {
  return x && x instanceof EventStream
}

export class EventStreamDispatcher<T> extends Dispatcher<T> {
  // EventStream does not have any special dispatching requirements
  // in addition to multicasting
}
