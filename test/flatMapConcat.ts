import * as F from "../bacon"
import { run, Sync } from "./_base"

describe("EventStream.flatMapConcat", () => {
  it("results in EventStream", () => {
    expect(F.once("tsers").flatMapConcat(x => x + "!")).toBeInstanceOf(F.EventStream)
  })

  it("spawns new stream for each value and concatenate results into a single stream", () => {
    const recording = run(record => {
      F.sequentially(1, [1, 2])
        .flatMapConcat(value => F.sequentially(3, [value, new F.Error("oops" as any), value]))
        .subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })

  it("works with same origin (follows transaction semantics)", () => {
    const recording = run(record => {
      const stream = F.fromArray([1, 2, 3])
      stream.flatMapConcat(_ => stream).subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })
})

describe("Property.flatMapConcat", () => {
  it("results in Property", () => {
    expect(F.constant("tsers").flatMapConcat(x => x + "!")).toBeInstanceOf(F.Property)
  })

  it("spawns new stream for all events including Init", () => {
    const recording = run(record => {
      F.sequentially(1, [1, 2])
        .toProperty(0)
        .flatMapConcat(value => F.fromArray([value, value]))
        .subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })

  it("waits until the previous inner source is ended before starting a new one", () => {
    const recording = run(record => {
      F.sequentially(1, [1, 2])
        .toProperty(0)
        .flatMapConcat(value => F.sequentially(5, [value, value]))
        .subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })

  it("works also if inner source is Property", () => {
    const recording = run(record => {
      F.sequentially(1, [1, 2])
        .toProperty(0)
        .flatMapConcat(value => F.constant(value + 1))
        .subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })

  it("works with same origin (follows transaction semantics)", () => {
    const recording = run(record => {
      const prop = F.fromArray([1, 2, 3]).toProperty(0)
      prop.flatMapConcat(_ => prop).subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })
})
