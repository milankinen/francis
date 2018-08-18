import * as F from "../src/bacon"
import { byLabel, labeled, run, Sync } from "./_base"

describe("Property.changes", () => {
  it("results in EventStream", () => {
    expect(F.constant(1).changes()).toBeInstanceOf(F.EventStream)
  })

  it("skips property's initial event", () => {
    const recording = run(record => {
      F.fromArray([1, 2])
        .toProperty(0)
        .changes()
        .subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })

  it("skips startWith initial event", () => {
    const recording = run(record => {
      F.fromArray([1, 2])
        .toProperty()
        .startWith(0)
        .changes()
        .subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })

  it("skips cached property latest value event when re-subscribing", () => {
    const recording = run((record, wait) => {
      const prop = F.sequentially(1, [1, 2, 3, 4]).toProperty(0)
      prop.take(3).subscribe(() => {})
      wait(20, () => {
        prop.toEventStream().subscribe(labeled(record, ".toEventStream"))
        prop.changes().subscribe(labeled(record, ".changes"))
      })
    })
    expect(byLabel(recording)).toMatchSnapshot()
  })
})
