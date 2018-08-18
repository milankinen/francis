import * as F from "../src/bacon"
import { byLabel, labeled, run, Sync } from "./_base"

describe("EventStream.take", () => {
  it("results in EventStream", () => {
    expect(F.once(1).take(1)).toBeInstanceOf(F.EventStream)
  })

  it("takes first N elements", () => {
    const recording = run(
      record =>
        F.fromArray([1, 2, 3, 4])
          .take(2)
          .subscribe(record) && record(Sync),
    )
    expect(recording).toMatchSnapshot()
  })

  it("works with N=0", () => {
    const recording = run(
      record =>
        F.fromArray([1, 2, 3, 4])
          .take(0)
          .subscribe(record) && record(Sync),
    )
    expect(recording).toMatchSnapshot()
  })

  it("is stateful", () => {
    const recording = run((record, wait) => {
      const stream = F.fromArray([1, 2, 3, 4]).take(2)
      stream.subscribe(labeled(record, "first"))
      wait(10, () => stream.subscribe(labeled(record, "second")))
    })
    expect(byLabel(recording)).toMatchSnapshot()
  })

  it("passthroughs errors", () => {
    const recording = run(record =>
      F.fromArray([1, new F.Error("fuk" as any), 2, 3, 4])
        .take(3)
        .subscribe(record),
    )
    expect(recording).toMatchSnapshot()
  })
})

describe("Property.take", () => {
  it("results in Property", () => {
    expect(F.constant(1).take(1)).toBeInstanceOf(F.Property)
  })

  it("can take initial event", () => {
    const recording = run(record =>
      F.fromArray([1, 2, 3, 4])
        .toProperty(0)
        .take(2)
        .subscribe(record),
    )
    expect(recording).toMatchSnapshot()
  })

  it("takes N next events if inital event is not present", () => {
    const recording = run(record =>
      F.fromArray([1, 2, 3, 4])
        .toProperty()
        .take(2)
        .subscribe(record),
    )
    expect(recording).toMatchSnapshot()
  })

  it("is stateful but returns latest taken value to late subscribers", () => {
    const recording = run((record, wait) => {
      const prop = F.fromArray([1, 2, 3, 4])
        .toProperty()
        .take(2)
      prop.subscribe(labeled(record, "first"))
      wait(10, () => prop.subscribe(labeled(record, "second")))
    })
    expect(byLabel(recording)).toMatchSnapshot()
  })
})
