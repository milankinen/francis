import { InvokeableWithParam, invokeWith, Source } from "../_core"
import { makeEventStream } from "../_obs"
import { EventStream, isEventStream } from "../EventStream"
import { Observable } from "../Observable"
import { Property } from "../Property"
import { scheduleActivationTask } from "../scheduler/index"
import { Identity } from "./_base"

export function toEventStream<T>(observable: Observable<T>): EventStream<T> {
  return isEventStream<T>(observable)
    ? observable
    : makeEventStream(new ToEventStream((observable as Property<T>).src))
}

class ToEventStream<T> extends Identity<T> implements InvokeableWithParam<boolean> {
  constructor(source: Source<T>) {
    super(source)
  }

  public activate(initialNeeded: boolean): void {
    scheduleActivationTask(invokeWith(this, initialNeeded))
  }

  public invoke(initialNeeded: boolean): void {
    if (this.active) {
      this.subs.activate(initialNeeded)
    }
  }
}
