import * as F from "../bacon"
import { runner, Sync } from "./_base"

describe("EventStream.flatMapWithConcurrencyLimit", () => {
  it("results in EventStream", () => {
    expect(F.once("tsers").flatMapWithConcurrencyLimit(1, x => x + "!")).toBeInstanceOf(
      F.EventStream,
    )
  })

  it("spawns new stream for each value and concatenate results into a single stream", done => {
    runner()
      .setup(record => {
        F.sequentially(1, [1, 2, 3])
          .flatMapWithConcurrencyLimit(2, value => F.sequentially(2, [value, value]))
          .subscribe(record)
      })
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("works with same origin (follows transaction semantics)", done => {
    runner()
      .setup(record => {
        const stream = F.fromArray([1, 2, 3])
        stream.flatMapWithConcurrencyLimit(2, _ => stream).subscribe(record)
        record(Sync)
      })
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })
})

describe("Property.flatMapWithConcurrencyLimit", () => {
  it("results in Property", () => {
    expect(F.constant("tsers").flatMapWithConcurrencyLimit(1, x => x + "!")).toBeInstanceOf(
      F.Property,
    )
  })
  it("spawns new stream for all events including Init", done => {
    runner()
      .setup(record => {
        F.sequentially(1, [1, 2])
          .toProperty(0)
          .flatMapWithConcurrencyLimit(2, value => F.sequentially(2, [value, value]))
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
        prop.flatMapWithConcurrencyLimit(2, _ => prop).subscribe(record)
        record(Sync)
      })
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })
})
