import * as F from "../src/bacon"
import { run, Sync } from "./_base"

describe("EventStream.throttle", () => {
  it("results in EventStream", () => {
    expect(F.once(1).throttle(1)).toBeInstanceOf(F.EventStream)
  })

  it("outputs at steady intervals, without waiting for quiet period", () => {
    const recording = run((record, _, now) => {
      const t = now()
      F.sequentially(2, [1, 2, 3])
        .throttle(3)
        .subscribe(x =>
          record({
            event: x,
            tick: now() - t,
          }),
        )
    })
    expect(recording).toMatchSnapshot()
  })
})

describe("Property.throttle", () => {
  it("results in Property", () => {
    expect(F.constant(1).throttle(1)).toBeInstanceOf(F.Property)
  })

  it("throttles changes but not initial value", () => {
    const recording = run((record, _, now) => {
      const t = now()
      F.sequentially(2, [1, 2, 3])
        .toProperty(0)
        .throttle(3)
        .subscribe(x =>
          record({
            event: x,
            tick: now() - t,
          }),
        )
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })
})
