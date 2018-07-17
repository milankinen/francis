import * as F from "../bacon"
import { run, Sync } from "./_base"

describe("EventStream.first", () => {
  it("results in EventStream", () => {
    expect(F.once(1).first()).toBeInstanceOf(F.EventStream)
  })

  it("takes first event and ends", () => {
    const recording = run(
      record =>
        F.fromArray([1, 2, 3, 4])
          .first()
          .subscribe(record) && record(Sync),
    )
    expect(recording).toMatchSnapshot()
  })
})

describe("Property.first", () => {
  it("results in Property", () => {
    expect(F.constant(1).first()).toBeInstanceOf(F.Property)
  })

  it("takes first event and ends", () => {
    const recording = run(
      record =>
        F.fromArray([1, 2, 3, 4])
          .toProperty(0)
          .first()
          .subscribe(record) && record(Sync),
    )
    expect(recording).toMatchSnapshot()
  })
})
