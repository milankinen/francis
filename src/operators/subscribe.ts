import { AnyEvent, Dispose, Handler } from "../_interfaces"
import { Transaction } from "../_tx"
import * as Event from "../Event"
import { Observable } from "../Observable"
import { EffectRunner, runEffects } from "./_eff"

export function subscribe<T>(handler: Handler<T>, observable: Observable<T>): Dispose {
  const eh = new EffHandler(handler)
  runEffects(eh, observable)
  return function dispose(): void {
    eh.dispose()
  }
}

class EffHandler<T> extends EffectRunner<T> {
  constructor(private handler: Handler<T>) {
    super()
  }

  public next(tx: Transaction, val: T): void {
    this.handleEvent(new Event.Next(val))
  }

  public error(tx: Transaction, err: Error): void {
    this.handleEvent(new Event.Error(err))
  }

  public end(tx: Transaction): void {
    this.dispose()
    this.handleEvent(new Event.End())
  }

  private handleEvent(event: AnyEvent<T>): void {
    const handler = this.handler
    const result = handler(event)
    if (result === Event.noMore) {
      this.dispose()
    }
  }
}
