import * as F from "../src/bacon"
import { byLabel, labeled, run } from "./_base"

describe("F.concatAll", () => {
  it("results in EventStream", () => {
    expect(F.concatAll([F.once("lol"), F.once("bal")])).toBeInstanceOf(F.EventStream)
  })

  it("concats all given streams and properties into a single stream and ends when all of them are exhausted", () => {
    const recording = run(record => {
      F.concatAll([
        F.sequentially(2, [1, new F.Error("lol" as any), 2]),
        F.constant(3),
        F.once(4),
      ]).subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })

  it("remembers exhausted streams when subscribing again after disposal", () => {
    const recording = run((record, wait) => {
      const record1st = labeled(record, "first")
      const record2nd = labeled(record, "second")
      const record3rd = labeled(record, "third")
      const s = F.concatAll(F.sequentially(10, [1, 2, 3]), F.constant(4), F.once(5))
      const dispose1st = s.subscribe(record1st)
      wait(25, dispose1st)
      wait(40, () => {
        const dispose2nd = s.subscribe(record2nd)
        wait(50, dispose2nd)
      })
      wait(150, () => s.subscribe(record3rd))
    })
    expect(byLabel(recording)).toMatchSnapshot()
  })
})
