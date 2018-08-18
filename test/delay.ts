import * as F from "../src/bacon"
import { run, Sync } from "./_base"

describe("EventStream.delay", () => {
  it("results in EventStream", () => {
    expect(F.once(1).delay(1)).toBeInstanceOf(F.EventStream)
  })

  it("delays all events the given amount milliseconds", () => {
    const recording = run((record, _, now) => {
      F.sequentially(1, [1, 2, 3])
        .map(val => ({ tick: now(), val }))
        .delay(5)
        .onValue(({ val, tick }) => record({ val, delay: now() - tick }))
    })
    expect(recording).toMatchSnapshot()
  })
})

describe("Property.delay", () => {
  it("results in Property", () => {
    expect(F.constant(1).delay(1)).toBeInstanceOf(F.Property)
  })

  it("passes initial event immediately and after that delays all events the given amount milliseconds", () => {
    const recording = run((record, _, now) => {
      F.sequentially(1, [1, 2, 3])
        .toProperty(0)
        .map(val => ({ tick: now(), val }))
        .delay(5)
        .onValue(({ val, tick }) => record({ val, delay: now() - tick }))
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })
})
