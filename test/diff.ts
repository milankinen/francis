import * as F from "../bacon"
import { run, Sync } from "./_base"

describe("EventStream.diff", () => {
  it("results in EventStream", () => {
    expect(F.once("tsers").diff("lol", (a, b) => a.length - b.length)).toBeInstanceOf(F.EventStream)
  })

  it("apply diff function to previous and current values, passing through errors", () => {
    const recording = run(record => {
      F.sequentially(1, [1, 2, new F.Error("tsers" as any), 3])
        .diff(0, (a, b) => a + b)
        .subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })
})

describe("Property.diff", () => {
  it("results in Property", () => {
    expect(F.constant("tsers").diff("lol", (a, b) => a.length - b.length)).toBeInstanceOf(
      F.Property,
    )
  })

  it("with initial value, starts with f(start, initial)", () => {
    const recording = run(record => {
      F.sequentially(1, [2, new F.Error("tsers" as any), 3])
        .toProperty(1)
        .diff(0, (a, b) => a + b)
        .subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })

  it("without initial value, works like EventStream.diff", () => {
    const recording = run(record => {
      F.sequentially(1, [1, 2, new F.Error("tsers" as any), 3])
        .toProperty()
        .diff(0, (a, b) => a + b)
        .subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })
})
