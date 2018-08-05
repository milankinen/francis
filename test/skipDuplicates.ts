import * as F from "../bacon"
import { run, Sync } from "./_base"

describe("EventStream.skipDuplicates", () => {
  it("results in EventStream", () => {
    expect(F.once("tsers").skipDuplicates()).toBeInstanceOf(F.EventStream)
  })

  it("drops duplicates", () => {
    const recording = run(record => {
      F.sequentially(1, [1, 2, new F.Error("tsers" as any), 2, 3, 1])
        .skipDuplicates()
        .subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })

  it("works with undefineds", () => {
    const recording = run(record => {
      F.sequentially(1, [undefined, undefined, 2, 3, 3, 1])
        .skipDuplicates()
        .subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })

  it("allows using custom equality function", () => {
    const recording = run(record => {
      F.sequentially(1, [1, 2, -2, 3, -1, -1, 1])
        .skipDuplicates((a, b) => Math.abs(a) === Math.abs(b))
        .subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })
})

describe("Property.skipDuplicates", () => {
  it("results in Property", () => {
    expect(F.constant("tsers").skipDuplicates()).toBeInstanceOf(F.Property)
  })

  it("drops duplicates", () => {
    const recording = run(record => {
      F.sequentially(1, [1, 2, new F.Error("tsers" as any), 2, 3, 1])
        .toProperty(0)
        .skipDuplicates()
        .subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })

  it("works with undefineds", () => {
    const recording = run(record => {
      F.sequentially(1, [undefined, undefined, 2, 3, 3, 1])
        .toProperty(undefined)
        .skipDuplicates()
        .subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })
})
