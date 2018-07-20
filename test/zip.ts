import * as F from "../bacon"
import { run } from "./_base"

describe("F.zipWith", () => {
  it("results in EventStream", () => {
    expect(F.zipWith(join, [F.once(1), F.once(1)])).toBeInstanceOf(F.EventStream)
  })

  it("pairwise combines values from two streams using given combinator function", () => {
    const recording = run(record =>
      F.zipWith(join, [F.sequentially(1, [1, 2, 3]), F.sequentially(1, ["a", "b", "c"])]).subscribe(
        record,
      ),
    )
    expect(recording).toMatchSnapshot()
  })

  it("passes through errors", () => {
    const recording = run(record =>
      F.zipWith(join, [
        F.sequentially(1, [1, new F.Error("lol" as any), 2, 3]),
        F.sequentially(5, ["a", "b", new F.Error("bal" as any), "c"]),
      ]).subscribe(record),
    )
    expect(recording).toMatchSnapshot()
  })

  it("completes as soon as possible", () => {
    const recording = run(record =>
      F.zipWith(join, [F.sequentially(1, [1]), F.sequentially(1, ["a", "b", "c"])]).subscribe(
        record,
      ),
    )
    expect(recording).toMatchSnapshot()
  })

  it("can zip an observable with itself", () => {
    const recording = run(record => {
      const s = F.sequentially(1, ["a", "b", "c"])
      F.zipWith(join, [s, s.map(x => x.toUpperCase())]).subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })

  it("works with zero streams (= F.never())", () => {
    const recording = run(record => {
      F.zipWith(join, [] as any).subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })

  it("works with one stream", () => {
    const recording = run(record => {
      F.zipWith(join, [F.sequentially(1, ["a", "b", "c"])]).subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })

  it("fires for Property events too (unlike F.when)", () => {
    const recording = run(record => {
      const stream = F.sequentially(1, [1, 2, 3, 4])
      const prop = F.sequentially(1, [2, 3, 4, 5]).toProperty()
      F.zipWith(join, [stream, prop]).subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })

  it("accepts array of stream as first param too", () => {
    const recording = run(record => {
      const s = F.sequentially(1, ["a", "b", "c"])
      const streams = [s, s.map(x => x.toUpperCase())]
      F.zipWith(streams, join).subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })
})

function join(...args: any[]): string {
  return args.join("")
}
