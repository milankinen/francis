import * as F from "../src/bacon"
import { run, Sync } from "./_base"

describe("EventStream.mapError", () => {
  it("results in EventStream", () => {
    expect(F.once("tsers").mapError(x => x.message)).toBeInstanceOf(F.EventStream)
  })

  it("maps error events and passthroughs next events", () => {
    const recording = run(record =>
      F.sequentially(1, ["lol", new F.Error("tsers" as any), "bal"])
        .mapError(e => e + "!")
        .subscribe(record),
    )
    expect(recording).toMatchSnapshot()
  })

  it("follows function construction semantics", () => {
    const recording = run(record =>
      F.sequentially(1, ["lol", new F.Error(new Error("tsers")), "bal"])
        .mapError(".message" as any)
        .subscribe(record),
    )
    expect(recording).toMatchSnapshot()
  })
})

describe("Property.mapError", () => {
  it("results in Property", () => {
    expect(F.constant("tsers").mapError(x => x.message)).toBeInstanceOf(F.Property)
  })

  it("maps error events and passthroughs next events", () => {
    const recording = run(record => {
      F.sequentially(1, ["lol", new F.Error("tsers" as any), "bal"])
        .toProperty("...")
        .mapError(e => e + "!")
        .subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })
})
