import * as F from "../bacon"
import { run, Sync } from "./_base"

describe("F.never", () => {
  it("results in EventStream", () => {
    expect(F.never()).toBeInstanceOf(F.EventStream)
  })

  it("ends asynchronously", () => {
    const recording = run(record => {
      F.never().subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })
})
