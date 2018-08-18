import * as F from "../src/bacon"
import { run } from "./_base"

describe("F.when", () => {
  const [a, b, c, _] = ["a", "b", "c", "_"]
  it("results in EventStream", () => {
    expect(F.when([F.once("tsers")], () => {})).toBeInstanceOf(F.EventStream)
  })

  it("synchronizes on join patterns", () => {
    const recording = run(record => {
      const as = F.sequentially(1, [a, _, a, a, _, a, _, _, a, a]).filter(x => x === a)
      const bs = F.sequentially(1, [_, b, _, _, b, _, b, b, _, _]).filter(x => x === b)
      // prettier-ignore
      F.when(
          [as, bs], join,
          [as],     join,
        ).subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })

  it("considers the join patterns from top to bottom", () => {
    const recording = run(record => {
      const as = F.sequentially(1, [a, _, a, a, _, a, _, _, a, a]).filter(x => x === a)
      const bs = F.sequentially(1, [_, b, _, _, b, _, b, b, _, _]).filter(x => x === b)
      // prettier-ignore
      F.when(
          [as],     join,
          [as, bs], join,
        ).subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })

  it("handles any number of join patterns", () => {
    const recording = run(record => {
      const as = F.sequentially(1, [a, _, a, _, a, _, a, _, _, _, a, a]).filter(x => x === a)
      const bs = F.sequentially(1, [_, b, _, _, _, b, _, b, _, b, _, _]).filter(x => x === b)
      const cs = F.sequentially(1, [_, _, _, c, _, _, _, _, c, _, _, _]).filter(x => x === c)
      // prettier-ignore
      F.when(
          [as, bs, cs], join,
          [as, bs],     join,
          [as],         join
        ).subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })

  it("doesn't synchronize on properties", () => {
    const recording = run(record => {
      const p = F.fromPoll(1, () => "p")
        .take(100)
        .toProperty()
      const s = F.sequentially(3, ["1", "2", "3"])
      // prettier-ignore
      F.when(
          [p, s], join
        ).subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })

  it("doesn't synchronize if property is missing value", () => {
    const recording = run(record => {
      const p = F.later(3, "p").toProperty()
      const s = F.later(1, "s")
      // prettier-ignore
      F.when(
          [p, s], join
        ).subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })

  it("rejects patterns with Properties only", () => {
    expect(() => F.when([F.constant("tsers")], () => {})).toThrowError()
  })
})

function join(...args: any[]): string {
  return args.join("")
}
