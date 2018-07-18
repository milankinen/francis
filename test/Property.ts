import * as F from "../bacon"
import { identity } from "../src/_util"
import { byLabel, labeled, run, Sync } from "./_base"

describe("F.Property", () => {
  it("emits it's initial state (if any) synchronously", () => {
    const recording = run(record => {
      F.constant("Has initial state").subscribe(record)
      F.once("Doesn't have initial state")
        .toProperty()
        .subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })

  it("replays its latest state between activations", () => {
    const recording = run((record, wait) => {
      const prop = F.sequentially(10, [1, 2, 3]).toProperty(0)
      prop.take(2).subscribe(labeled(record, "first"))
      wait(100, () => prop.subscribe(labeled(record, "second")))
    })
    expect(byLabel(recording)).toMatchSnapshot()
  })

  it("replays its latest state only once", () => {
    const recording = run((record, wait) => {
      let i = 1
      const prop = F.fromBinder<string>(sink => i-- && sink("tsers"))
        .toProperty()
        .map(identity)
        .map(identity)
        .map(identity)
      prop.take(1).subscribe(() => {})
      wait(100, () => prop.subscribe(record))
    })
    expect(recording).toMatchSnapshot()
  })
})
