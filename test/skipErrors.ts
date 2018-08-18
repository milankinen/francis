import * as F from "../src/bacon"
import { run, Sync } from "./_base"

describe("EventStream.skipErrors", () => {
  it("results in EventStream", () => {
    expect(F.once("tsers").skipErrors()).toBeInstanceOf(F.EventStream)
  })

  it("drops out error events and passthroughs next events", () => {
    const recording = run(record =>
      F.sequentially(1, ["lol", new F.Error("tsers" as any), "bal"])
        .skipErrors()
        .subscribe(record),
    )
    expect(recording).toMatchSnapshot()
  })
})

describe("Property.skipErrors", () => {
  it("results in Property", () => {
    expect(F.constant("tsers").skipErrors()).toBeInstanceOf(F.Property)
  })

  it("drops out error events and passthroughs next events", () => {
    const recording = run(record => {
      F.sequentially(1, ["lol", new F.Error("tsers" as any), "bal"])
        .toProperty("...")
        .skipErrors()
        .subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })
})
