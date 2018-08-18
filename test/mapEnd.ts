import * as F from "../src/bacon"
import { run, Sync } from "./_base"

describe("EventStream.mapEnd", () => {
  it("results in EventStream", () => {
    expect(F.once("tsers").mapEnd(() => "lolbal")).toBeInstanceOf(F.EventStream)
  })

  it("adds an extra event to the end of stream", () => {
    const recording = run(record =>
      F.sequentially(1, ["lol", "bal"])
        .mapEnd(() => "tsers")
        .subscribe(record),
    )
    expect(recording).toMatchSnapshot()
  })

  it("accepts a constant value too", () => {
    const recording = run(record =>
      F.sequentially(1, ["lol", "bal"])
        .mapEnd("tsers")
        .subscribe(record),
    )
    expect(recording).toMatchSnapshot()
  })
})

describe("Property.mapEnd", () => {
  it("results in Property", () => {
    expect(F.constant("tsers").mapEnd(() => "lolbal")).toBeInstanceOf(F.Property)
  })

  it("adds an extra event to the end of stream", () => {
    const recording = run(record => {
      F.sequentially(1, ["lol", "bal"])
        .toProperty("...")
        .mapEnd(() => "tsers")
        .subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })
})
