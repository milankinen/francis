import * as F from "../src/bacon"
import { run, Sync } from "./_base"

describe("EventStream.flatMapError", () => {
  it("results in EventStream", () => {
    expect(F.once("tsers").flatMapError(x => x.message)).toBeInstanceOf(F.EventStream)
  })

  it("allows spawning a new stream from an error events, passing through next events", () => {
    const recording = run(record => {
      F.sequentially(1, ["1", "2", new F.Error(new Error("tsers")), "3"])
        .flatMapError(e => F.fromArray([e.message + "!", e.message + "?"]))
        .subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })
})

describe("Property.flatMapError", () => {
  it("results in Property", () => {
    expect(F.constant("tsers").flatMapError(x => x.message)).toBeInstanceOf(F.Property)
  })

  it("allows spawning a new stream from an error events, passing through next events", () => {
    const recording = run(record => {
      F.sequentially(1, ["2", new F.Error(new Error("tsers")), "3"])
        .toProperty("1")
        .flatMapError(e => F.fromArray([e.message + "!", e.message + "?"]))
        .subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })
})
