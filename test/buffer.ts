import * as F from "../bacon"
import { run } from "./_base"

describe("EventStream.bufferWithTime", () => {
  it("results in EventStream", () => {
    expect(F.once(1).bufferWithTime(1)).toBeInstanceOf(F.EventStream)
  })

  it("returns events in bursts, passing through errors", () => {
    const recording = run((record, _, now) => {
      F.mergeAll(
        F.sequentially(2, [1, 2, 3, 4, 5, 6, 7]),
        F.sequentially<number>(2, [new F.Error("tsers" as any)]),
      )
        .bufferWithTime(7)
        .subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })

  it("works with empty stream", () => {
    const recording = run((record, _, now) => {
      F.never()
        .bufferWithTime(1)
        .subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })
})

describe("EventStream.bufferWithCount", () => {
  it("results in EventStream", () => {
    expect(F.once(1).bufferWithCount(1)).toBeInstanceOf(F.EventStream)
  })

  it("returns events in chunks of fixed size, passing through errors", () => {
    const recording = run((record, _, now) => {
      F.sequentially(2, [1, 2, new F.Error("tsers" as any), 3, 4, 5])
        .bufferWithCount(2)
        .subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })

  it("works with empty stream", () => {
    const recording = run((record, _, now) => {
      F.never()
        .bufferWithCount(2)
        .subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })
})

describe("EventStream.bufferWithTimeOrCount", () => {
  it("results in EventStream", () => {
    expect(F.once(1).bufferWithTimeOrCount(1, 1)).toBeInstanceOf(F.EventStream)
  })

  it("flushes correctly when scheduled and count-based times overlap", () => {
    const recording = run((record, _, now) => {
      F.mergeAll(F.sequentially(1, [1, 2, 3, 4, 5, 6, 7]), F.sequentially(20, [10, 20, 30]))
        .bufferWithTimeOrCount(10, 5)
        .subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })
})
