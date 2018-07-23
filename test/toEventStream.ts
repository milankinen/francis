import * as F from "../bacon"
import { run, Sync } from "./_base"

describe("Observable.toEventStream", () => {
  it("results in EventStream", () => {
    expect((F.once(1) as any).toEventStream()).toBeInstanceOf(F.EventStream)
    expect(F.constant(1).toEventStream()).toBeInstanceOf(F.EventStream)
  })

  it("responds asynchronously", () => {
    const recording = run(record => {
      F.fromArray([1, 2])
        .toProperty(0)
        .toEventStream()
        .subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })

  it("does not activate the source if subscription is disposed immediately", () => {
    const recording = run((record, wait) => {
      const dispose = F.fromBinder(() => record("activate!"))
        .toProperty(0)
        .toEventStream()
        .subscribe(() => {})
      dispose()
      wait(100, () => record("end"))
    })
    expect(recording).toEqual(["end"])
  })
})
