import * as F from "../src/bacon"
import { run, Sync } from "./_base"

describe("EventStream.flatMapWithConcurrencyLimit", () => {
  it("results in EventStream", () => {
    expect(F.once("tsers").flatMapWithConcurrencyLimit(1, x => x + "!")).toBeInstanceOf(
      F.EventStream,
    )
  })

  it("spawns new stream for each value and concatenate results into a single stream", () => {
    const recording = run(record => {
      F.sequentially(1, [1, 2, 3])
        .flatMapWithConcurrencyLimit(2, value => F.sequentially(2, [value, value]))
        .subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })

  it("works with same origin (follows transaction semantics)", () => {
    const recording = run(record => {
      const stream = F.fromArray([1, 2, 3])
      stream.flatMapWithConcurrencyLimit(2, _ => stream).subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })
})

describe("Property.flatMapWithConcurrencyLimit", () => {
  it("results in Property", () => {
    expect(F.constant("tsers").flatMapWithConcurrencyLimit(1, x => x + "!")).toBeInstanceOf(
      F.Property,
    )
  })
  it("spawns new stream for all events including Init", () => {
    const recording = run(record => {
      F.sequentially(1, [1, 2])
        .toProperty(0)
        .flatMapWithConcurrencyLimit(2, value => F.sequentially(2, [value, value]))
        .subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })

  it("works with same origin (follows transaction semantics)", () => {
    const recording = run(record => {
      const prop = F.fromArray([1, 2, 3]).toProperty(0)
      prop.flatMapWithConcurrencyLimit(2, _ => prop).subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })
})
