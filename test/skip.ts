import * as F from "../bacon"
import { run } from "./_base"

describe("EventStream.skip", () => {
  it("results in EventStream", () => {
    expect(F.once(1).skip(1)).toBeInstanceOf(F.EventStream)
  })

  it("skips the given first n events before starts emitting values", () => {
    const recording = run(record =>
      F.fromArray([1, 2, 3, 4])
        .skip(2)
        .subscribe(record),
    )
    expect(recording).toMatchSnapshot()
  })
})

describe("Property.skip", () => {
  it("results in Property", () => {
    expect(F.constant(1).skip(1)).toBeInstanceOf(F.Property)
  })

  it("skips the given first n events, including initial event, before starts emitting values", () => {
    const recording = run(record =>
      F.fromArray([1, 2, 3, 4])
        .toProperty(0)
        .skip(2)
        .subscribe(record),
    )
    expect(recording).toMatchSnapshot()
  })
})
