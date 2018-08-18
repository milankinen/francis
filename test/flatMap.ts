import * as F from "../src/bacon"
import { run, Sync } from "./_base"

describe("EventStream.flatMap", () => {
  it("results in EventStream", () => {
    expect(F.once("tsers").flatMap(x => x + "!")).toBeInstanceOf(F.EventStream)
  })

  it("spawns new stream for each value and collect results into a single stream", () => {
    const recording = run(record => {
      F.sequentially(1, [1, 2])
        .flatMap(value => F.sequentially(2, [value, new F.Error("oops" as any), value]))
        .subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })

  it("passes source errors through to the result", () => {
    const recording = run(record => {
      F.sequentially(1, [new F.Error("oops" as any), 1])
        .flatMap(value => F.later(1, value + 1))
        .subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })

  it("works also if inner source is Property", () => {
    const recording = run(record => {
      F.sequentially(1, ["lol", "bal"])
        .flatMap(value => F.constant(value.toUpperCase()))
        .subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })

  it("works also if inner source is constant", () => {
    const recording = run(record => {
      F.sequentially(1, ["lol", "bal"])
        .flatMap(value => value.toUpperCase())
        .subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })

  it("works with same origin (follows transaction semantics)", () => {
    const recording = run(record => {
      const stream = F.fromArray([1, 2, 3])
      stream.flatMap(_ => stream).subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })

  it("respects function construction rules", () => {
    const recording = run(record => {
      F.once({ francis: F.once("Sir Francis") })
        .flatMap(".francis" as any)
        .subscribe(record)
      F.once({ bacon: "Sir Bacon" })
        .flatMap(".bacon" as any)
        .subscribe(record)
      // tslint:disable-next-line:align whitespace
      ;(F.once("Bacon") as any)
        .flatMap((x: any, y: any, z: any) => x + " " + y + " " + z, "Sir", "Francis")
        .subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })
})

describe("Property.flatMap", () => {
  it("results in Property", () => {
    expect(F.constant("tsers").flatMap(x => x + "!")).toBeInstanceOf(F.Property)
  })

  it("spawns new stream for all events including Init", () => {
    const recording = run(record => {
      F.sequentially(1, [1, 2])
        .toProperty(0)
        .flatMap(value => F.fromArray([value, value]))
        .subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })

  it("works also if inner source is Property", () => {
    const recording = run(record => {
      F.sequentially(1, [1, 2])
        .toProperty(0)
        .flatMap(value => F.constant(value + 1))
        .subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })

  it("works with same origin (follows transaction semantics)", () => {
    const recording = run(record => {
      const prop = F.fromArray([1, 2, 3]).toProperty(0)
      prop.flatMap(_ => prop).subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })
})
