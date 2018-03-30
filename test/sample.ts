import * as F from "../bacon"
import { runner, Sync } from "./_base"

describe("Property.sampledBy(stream)", () => {
  it("samples property at events, resulting to EventStream", done => {
    runner()
      .setup(record => {
        const value = F.sequentially(10, [1, 2, 3, 4]).toProperty(0)
        const stream = F.sequentially(25, [true, true, true])
        const result = value.sampledBy(stream)
        expect(result).toBeInstanceOf(F.EventStream)
        result.subscribe(record)
      })
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("includes errors from both Property and EventStream", done => {
    runner()
      .setup(record =>
        F.sequentially(15, [1, new F.Error("prop error" as any), 2])
          .toProperty()
          .sampledBy(F.sequentially(10, [1, 1, 1, new F.Error("stream error" as any), 1, 1, 1, 1]))
          .subscribe(record),
      )
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("ends when sampling stream ends", done => {
    runner()
      .setup(record =>
        F.sequentially(10, [1, 2, 3, 4, 5, 6, 7])
          .toProperty(0)
          .sampledBy(F.sequentially(15, [1, 1]))
          .subscribe(record),
      )
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("works with same origin (follows transaction semantics)", done => {
    runner()
      .setup(record => {
        const stream = F.sequentially(2, [1, 2])
        stream
          .toProperty()
          .sampledBy(stream)
          .subscribe(record)
      })
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("accepts optional combinator function", done => {
    runner()
      .setup(record =>
        F.sequentially(10, ["a", "b", "c"])
          .toProperty()
          .sampledBy(F.sequentially(15, [1, 2, 3, 4]), (v, s) => v + s)
          .subscribe(record),
      )
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("accepts normal function constructs as well", done => {
    runner()
      .setup(record =>
        F.constant([0])
          .sampledBy(F.sequentially(10, [[1], [2]]), ".concat" as any)
          .subscribe(record),
      )
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("does not duplicate same error (follows transaction semantics)", done => {
    runner()
      .setup(record => {
        const stream = F.sequentially(2, [1, new F.Error("oops" as any), 2])
        stream
          .toProperty()
          .sampledBy(stream)
          .subscribe(record)
      })
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })
})

describe("Property.sampledBy(property)", () => {
  it("samples property at sampler changes, resulting to Property", done => {
    runner()
      .setup(record => {
        const value = F.sequentially(10, [1, 2, 3, 4]).toProperty(0)
        const sampler = F.sequentially(25, [true, true]).toProperty(true)
        const result = value.sampledBy(sampler)
        expect(result).toBeInstanceOf(F.Property)
        result.subscribe(record)
        record(Sync)
      })
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("does not emit initial event if sampler is missing initial value", done => {
    runner()
      .setup(record => {
        F.constant("lol")
          .sampledBy(F.later(20, "bal").toProperty(), (v, s) => v + s)
          .subscribe(record)
        record(Sync)
      })
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("does not emit initial event if value is missing initial value", done => {
    runner()
      .setup(record => {
        F.once("lol")
          .toProperty()
          .sampledBy(F.later(10, "bal").toProperty(".."), (v, s) => v + s)
          .subscribe(record)
        record(Sync)
      })
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })
})
