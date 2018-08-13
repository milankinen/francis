import { Operation, Transaction } from "../../src/_tx"

describe("Transaction queue", () => {
  it("higher priority operations are queued first", () => {
    const q = [] as string[]
    const op = (prio: number, id: string) => new TestOp(prio, id, q)
    const tx = new Transaction()
    q.push("--- 1 ---")
    tx.queue(op(2, "a2"))
    tx.queue(op(3, "b3"))
    tx.queue(op(2, "c2"))
    tx.queue(op(4, "d4"))
    tx.queue(op(3, "e3"))
    tx.queue(op(1, "f1"))
    tx.consume()
    q.push("--- 2 ---")
    tx.queue(op(1, "g1"))
    tx.queue(op(3, "h3"))
    tx.queue(op(0, "i0"))
    tx.consume()
    expect(q).toEqual([
      "--- 1 ---",
      "f1",
      "a2",
      "c2",
      "b3",
      "e3",
      "d4",
      "--- 2 ---",
      "i0",
      "g1",
      "h3",
    ])
  })
})

class TestOp implements Operation {
  constructor(
    public readonly priority: number,
    private id: string,
    private executionQueue: string[],
  ) {}
  public exec(tx: Transaction): void {
    this.executionQueue.push(this.id)
  }
  public abort(): void {
    throw new Error("Aborted")
  }
}
