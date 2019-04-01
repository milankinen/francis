import { sendNextInTx } from "../_core"
import { makeProperty } from "../_obs"
import { Transaction } from "../_tx"
import { Property } from "../Property"
import { IndexedSource } from "./_indexed"
import { Buffer, extractPatternsAndBuffers, Pattern, When } from "./when"

export function update<ValueType>(
  initial: ValueType,
  ...patternsAndHandlers: any[]
): Property<ValueType> {
  const [patterns, buffers, sources] = extractPatternsAndBuffers(patternsAndHandlers, false)
  return makeProperty(new Update(initial, new IndexedSource(sources), patterns, buffers))
}

class Update<T> extends When {
  private has: boolean = false
  constructor(
    private state: T,
    source: IndexedSource<Buffer>,
    patterns: Pattern[],
    buffers: Buffer[],
  ) {
    super(source, patterns, buffers)
  }

  public activate(initialNeeded: boolean): void {
    super.activate(initialNeeded)
    this.sendInitial()
  }

  protected handleMatch(tx: Transaction, match: Pattern, vals: any[]): void {
    const { f } = match
    this.has = true
    this.sink.next(tx, (this.state = f(this.state, ...vals)))
  }

  private sendInitial(): void {
    if (this.active && !this.has) {
      this.has = true
      sendNextInTx(this.sink, this.state)
    }
  }
}
