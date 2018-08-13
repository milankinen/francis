import * as F from "../bacon"
import { run, Sync } from "./_base"

describe("F.later", () => {
  it("delays the given value and ends", () => {
    const recording = run((record, _, now) => {
      const t = now()
      F.later(10, "tsers").subscribe(event => record({ tick: now() - t, event }))
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })

  it("can be called without value", () => {
    const recording = run((record, _, now) => {
      const t = now()
      F.later(10).subscribe(event => record({ tick: now() - t, event }))
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })

  it("requires that delay is given and it's a number", () => {
    expect(() => F.later("tsers" as any)).toThrowError()
    expect(() => (F as any).later()).toThrowError()
  })
})
