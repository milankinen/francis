import * as F from "../bacon"
import { run, Sync } from "./_base"

describe("EventStream.bufferingThrottle", () => {
  it("results in EventStream", () => {
    expect(F.once(1).bufferingThrottle(1)).toBeInstanceOf(F.EventStream)
  })

  it("limits throughput but includes all events", () => {
    const recording = run((record, _, now) => {
      const t = now()
      F.sequentially(2, [1, 2, 3])
        .bufferingThrottle(3)
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

describe("Property.bufferingThrottle", () => {
  it("results in Property", () => {
    expect(F.constant(1).bufferingThrottle(1)).toBeInstanceOf(F.Property)
  })

  it("passes intial value immediately and limits changes throughput but includes all events", () => {
    const recording = run((record, _, now) => {
      const t = now()
      F.sequentially(2, [1, 2, 3])
        .toProperty(0)
        .bufferingThrottle(3)
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
