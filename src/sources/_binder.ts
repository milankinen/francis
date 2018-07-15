import { Subscriber } from "../_core"
import { Dispose, Sink, SinkEvent, SinkResult, Subscribe } from "../_interfaces"
import { isArray, isFunction } from "../_util"
import * as Event from "../Event"
import { Activation, Root } from "./_base"

export class FromBinder<T> extends Root<T> {
  constructor(public f: Subscribe<T>) {
    super(false)
  }

  protected create(subscriber: Subscriber<T>): Activation<T, FromBinder<T>> {
    return new FromBinderActivation(this, subscriber)
  }
}

class FromBinderActivation<T> extends Activation<T, FromBinder<T>> {
  private userDispose: Dispose | null = null

  protected start(): void {
    if (this.active) {
      const sink: Sink<T> = (event: SinkEvent<T>): SinkResult => {
        this.handleSinkEvent(event)
        return this.active ? Event.more : Event.noMore
      }
      // TODO try-catch?
      const { f } = this.owner
      const dispose = f(sink)
      if (isFunction(dispose)) {
        if (this.active) {
          this.userDispose = dispose
        } else {
          dispose()
        }
      }
    }
  }

  protected stop(): void {
    // TODO try-catch?
    const dispose = this.userDispose
    if (dispose !== null) {
      this.userDispose = null
      dispose()
    }
  }

  private handleSinkEvent(event: SinkEvent<T>): void {
    if (isArray(event)) {
      const n = event.length
      for (let i = 0; this.active && i < n; i++) {
        this.send(event[i])
      }
    } else {
      this.send(event)
    }
  }
}
