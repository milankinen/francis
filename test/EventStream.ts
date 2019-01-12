import * as F from "../src/index"
import { run } from "./_base"

describe("F.EventStream", () => {
  it("can be constructed by using subscribe function", () => {
    const recording = run(record => {
      const stream = new F.EventStream<number>(sink => {
        record("activated")
        sink(1)
        sink(2)
        sink(3)
        return () => {
          record("disposed")
        }
      })
      F.pipe(
        stream,
        F.take(2),
        F.onValue(x => record("Value: " + x)),
      )
    })
    expect(recording).toMatchInlineSnapshot(`
Array [
  "activated",
  "Value: 1",
  "Value: 2",
  "disposed",
]
`)
  })
})
