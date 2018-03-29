import { __DEVELOPER__, logAndThrow } from "../_assert"
import { Transaction } from "../_tx"
import { MulticastImplementation } from "./_base"

export class StreamMulticast<T> extends MulticastImplementation<T> {
  public initial(tx: Transaction, val: T): void {
    if (__DEVELOPER__) {
      logAndThrow("**BUG** EventStream multicast implementation received initial event")
    }
  }
  public noinitial(tx: Transaction): void {
    if (__DEVELOPER__) {
      logAndThrow("**BUG** EventStream multicast implementation received noinitial event")
    }
  }
}
