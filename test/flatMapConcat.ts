import * as F from "../bacon"
import { runner, Sync } from "./_base"

describe("EventStream.flatMapConcat", () => {
  it("results in EventStream", () => {
    expect(F.once("tsers").flatMapConcat(x => x + "!")).toBeInstanceOf(F.EventStream)
  })

  it("spawns new stream for each value and concatenate results into a single stream", done => {
    runner()
      .setup(record => {
        F.sequentially(1, [1, 2])
          .flatMapConcat(value => F.sequentially(3, [value, new F.Error("oops" as any), value]))
          .subscribe(record)
      })
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("works with same origin (follows transaction semantics)", done => {
    runner()
      .setup(record => {
        const stream = F.fromArray([1, 2, 3])
        stream.flatMapConcat(_ => stream).subscribe(record)
        record(Sync)
      })
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })
})

describe("Property.flatMapConcat", () => {
  it("results in Property", () => {
    expect(F.constant("tsers").flatMapConcat(x => x + "!")).toBeInstanceOf(F.Property)
  })

  it("spawns new stream for all events including Init", done => {
    runner()
      .setup(record => {
        F.sequentially(1, [1, 2])
          .toProperty(0)
          .flatMapConcat(value => F.fromArray([value, value]))
          .subscribe(record)
        record(Sync)
      })
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("waits until the previous inner source is ended before starting a new one", done => {
    runner()
      .setup(record => {
        F.sequentially(1, [1, 2])
          .toProperty(0)
          .flatMapConcat(value => F.sequentially(5, [value, value]))
          .subscribe(record)
        record(Sync)
      })
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("works also if inner source is Property", done => {
    runner()
      .setup(record => {
        F.sequentially(1, [1, 2])
          .toProperty(0)
          .flatMapConcat(value => F.constant(value + 1))
          .subscribe(record)
        record(Sync)
      })
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("works with same origin (follows transaction semantics)", done => {
    runner()
      .setup(record => {
        const prop = F.fromArray([1, 2, 3]).toProperty(0)
        prop.flatMapConcat(_ => prop).subscribe(record)
        record(Sync)
      })
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })
})
