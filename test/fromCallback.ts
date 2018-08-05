import * as F from "../bacon"
import { run, Sync } from "./_base"

describe("F.fromCallback", () => {
  it("results in EventStream", () => {
    expect(F.fromCallback(cb => null)).toBeInstanceOf(F.EventStream)
  })

  it("emits the callback value asynchronously", () => {
    const recording = run(record => {
      F.fromCallback<string>(cb => cb("tsers")).subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })
})

describe("F.fromNodeCallback", () => {
  it("results in EventStream", () => {
    expect(F.fromNodeCallback(cb => null)).toBeInstanceOf(F.EventStream)
  })

  it("emits the callback value asynchronously", () => {
    const recording = run(record => {
      F.fromNodeCallback<string>(cb => cb(null, "tsers")).subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })

  it("supports node callback errors", () => {
    const recording = run(record => {
      F.fromNodeCallback<string>(cb => cb(new Error("tsers"))).subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })
})
