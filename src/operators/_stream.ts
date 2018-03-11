import { __DEVBUILD__ } from "../_assert"
import { Transaction } from "../_tx"
import { MulticastImplementation } from "./_base"

export class StreamMulticast<T> extends MulticastImplementation<T> {
  public initial(tx: Transaction, val: T): void {
    devError()
  }
  public noinitial(tx: Transaction): void {
    devError()
  }
}

function devError(): void {
  throw new Error(
    __DEVBUILD__ ? "DevError: EventStreams do not support initial values" : "DevError",
  )
}
