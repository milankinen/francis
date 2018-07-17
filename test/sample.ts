import * as F from "../bacon"
import { run, Sync } from "./_base"

describe("Property.sampledBy(stream)", () => {
  it("samples property at events, resulting to EventStream", () => {
    const recording = run(record => {
      const value = F.sequentially(10, [1, 2, 3, 4]).toProperty(0)
      const stream = F.sequentially(25, [true, true, true])
      const result = value.sampledBy(stream)
      expect(result).toBeInstanceOf(F.EventStream)
      result.subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })

  it("includes errors from both Property and EventStream", () => {
    const recording = run(record =>
      F.sequentially(15, [1, new F.Error("prop error" as any), 2])
        .toProperty()
        .sampledBy(F.sequentially(10, [1, 1, 1, new F.Error("stream error" as any), 1, 1, 1, 1]))
        .subscribe(record),
    )
    expect(recording).toMatchSnapshot()
  })

  it("ends when sampling stream ends", () => {
    const recording = run(record =>
      F.sequentially(10, [1, 2, 3, 4, 5, 6, 7])
        .toProperty(0)
        .sampledBy(F.sequentially(15, [1, 1]))
        .subscribe(record),
    )
    expect(recording).toMatchSnapshot()
  })

  it("works with same origin (follows transaction semantics)", () => {
    const recording = run(record => {
      const stream = F.sequentially(2, [1, 2])
      stream
        .toProperty()
        .sampledBy(stream)
        .subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })

  it("accepts optional combinator function", () => {
    const recording = run(record =>
      F.sequentially(10, ["a", "b", "c"])
        .toProperty()
        .sampledBy(F.sequentially(15, [1, 2, 3, 4]), (v, s) => v + s)
        .subscribe(record),
    )
    expect(recording).toMatchSnapshot()
  })

  it("accepts normal function constructs as well", () => {
    const recording = run(record =>
      F.constant([0])
        .sampledBy(F.sequentially(10, [[1], [2]]), ".concat" as any)
        .subscribe(record),
    )
    expect(recording).toMatchSnapshot()
  })

  it("does not duplicate same error (follows transaction semantics)", () => {
    const recording = run(record => {
      const stream = F.sequentially(2, [1, new F.Error("oops" as any), 2])
      stream
        .toProperty()
        .sampledBy(stream)
        .subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })
})

describe("Property.sampledBy(property)", () => {
  it("samples property at sampler changes, resulting to Property", () => {
    const recording = run(record => {
      const value = F.sequentially(10, [1, 2, 3, 4]).toProperty(0)
      const sampler = F.sequentially(25, [true, true]).toProperty(true)
      const result = value.sampledBy(sampler)
      expect(result).toBeInstanceOf(F.Property)
      result.subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })

  it("does not emit initial event if sampler is missing initial value", () => {
    const recording = run(record => {
      F.constant("lol")
        .sampledBy(F.later(20, "bal").toProperty(), (v, s) => v + s)
        .subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })

  it("does not emit initial event if value is missing initial value", () => {
    const recording = run(record => {
      F.once("lol")
        .toProperty()
        .sampledBy(F.later(10, "bal").toProperty(".."), (v, s) => v + s)
        .subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })
})
