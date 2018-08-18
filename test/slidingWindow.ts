import * as F from "../src/bacon"
import { run, Sync } from "./_base"

describe("EventStream.slidingWindow", () => {
  it("results in Property", () => {
    expect(F.once("tsers").slidingWindow(2, 1)).toBeInstanceOf(F.Property)
  })

  it("slides the window over events, passing through errors", () => {
    const recording = run(record => {
      F.sequentially(1, [1, 2, new F.Error("tsers" as any), 3])
        .slidingWindow(2)
        .subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })

  it("accepts second parameter for minimum length of the window", () => {
    const recording = run(record => {
      F.sequentially(1, [1, 2, 3, 4])
        .slidingWindow(3, 2)
        .subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })
})

describe("Property.slidingWindow", () => {
  it("results in Property", () => {
    expect(F.constant("tsers").slidingWindow(2, 1)).toBeInstanceOf(F.Property)
  })

  it("slides the window over events, passing through errors", () => {
    const recording = run(record => {
      F.sequentially(1, [1, 2, new F.Error("tsers" as any), 3])
        .toProperty(0)
        .slidingWindow(2)
        .subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })
})
