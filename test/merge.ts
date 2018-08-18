import { identity } from "../src/_util"
import * as F from "../src/bacon"
import { run, Sync } from "./_base"

describe("F.mergeAll", () => {
  it("results in EventStream", () => {
    expect(F.mergeAll([F.once("lol"), F.once("bal")])).toBeInstanceOf(F.EventStream)
  })

  it("merges all given streams and ends when all of them are exhausted", () => {
    const recording = run(record => {
      F.mergeAll([
        F.sequentially(2, [1, 2]),
        F.sequentially(3, [3, 4]),
        F.sequentially(4, [5, 6]),
      ]).subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })

  it("does not duplicate same error from two streams", () => {
    const recording = run(record => {
      const src = F.sequentially(1, [1, new F.Error("lol" as any), 2, new F.Error("bal" as any), 3])
      const left = src.map(x => x * 2)
      const right = src.map(identity)
      F.mergeAll([left, right]).subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })

  it("supports arguments spread syntax", () => {
    const recording = run(record => {
      F.mergeAll(F.once("lol"), F.once("bal"))
        .map(x => x.toUpperCase())
        .subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })

  it("respects subscriber return value", () => {
    const recording = run(record => {
      F.mergeAll([
        F.sequentially(2, [1, 2]),
        F.sequentially(3, [3, 4]),
        F.sequentially(4, [5, 6]),
        F.fromBinder(() => () => record("disposed!")),
      ])
        .take(2)
        .subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })

  it("re-emits end event if all source streams have been exhausted", () => {
    const recording = run((record, wait) => {
      const merged = F.mergeAll([F.sequentially(2, [1, 2]), F.sequentially(3, [3, 4])])
      merged.subscribe(identity)
      wait(100, () => {
        merged.subscribe(record)
        record(Sync)
      })
    })
    expect(recording).toMatchSnapshot()
  })
})
