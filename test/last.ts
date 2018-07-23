import * as F from "../bacon"
import { run, Sync } from "./_base"

describe("EventStream.last", () => {
  it("results in EventStream", () => {
    expect(F.once(1).last()).toBeInstanceOf(F.EventStream)
  })

  it("takes last event and ends", () => {
    const recording = run(record =>
      F.fromArray([1, 2, 3, 4])
        .last()
        .subscribe(record),
    )
    expect(recording).toMatchSnapshot()
  })
})

describe("Property.last", () => {
  it("results in Property", () => {
    expect(F.constant(1).last()).toBeInstanceOf(F.Property)
  })

  it("takes last event and ends", () => {
    const recording = run(record =>
      F.fromArray([1, 2, 3, 4])
        .toProperty(0)
        .last()
        .subscribe(record),
    )
    expect(recording).toMatchSnapshot()
  })

  it("works with F.constant", () => {
    const recording = run(record => {
      F.constant("tsers")
        .last()
        .subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })
})
