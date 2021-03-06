import * as F from "../src/bacon"
import { byLabel, labeled, run, Sync } from "./_base"

describe("EventStream.takeWhile", () => {
  it("results in EventStream", () => {
    expect(F.once(1).takeWhile(x => true)).toBeInstanceOf(F.EventStream)
  })

  it("takes while predicate is true", () => {
    const recording = run(record =>
      F.sequentially(1, [1, new F.Error("tsers" as any), 2, 3])
        .takeWhile(x => x < 3)
        .subscribe(record),
    )
    expect(recording).toMatchSnapshot()
  })

  it("can filter by Property value", () => {
    const recording = run(record => {
      const s = F.sequentially(1, [1, 1, 2, 3, 4, 4, 8, 7])
      const odd = s.map(x => x % 2 !== 0).toProperty()
      s.takeWhile(odd).subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })

  it("remembers its end state", () => {
    const recording = run((record, wait) => {
      const s = F.sequentially(3, [1, 2, 3, 4, 5, 6, 7, 8]).takeWhile(x => x < 3)
      s.subscribe(labeled(record, "first"))
      wait(100, () => {
        s.subscribe(labeled(record, "second"))
      })
    })
    expect(byLabel(recording)).toMatchSnapshot()
  })
})

describe("Property.takeWhile", () => {
  it("results in Property", () => {
    expect(F.constant(1).takeWhile(x => true)).toBeInstanceOf(F.Property)
  })

  it("works synchronously", () => {
    const recording = run(record => {
      F.sequentially(1, [1, new F.Error("tsers" as any), 2, 3])
        .toProperty(0)
        .takeWhile(x => x < 3)
        .subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })
})
