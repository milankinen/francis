import * as F from "../bacon"
import { byLabel, labeled, run, Sync } from "./_base"

describe("EventStream.flatScan", () => {
  it("results in Property", () => {
    expect(F.once(1).flatScan(0, (s, a) => s + a)).toBeInstanceOf(F.Property)
  })

  it("accumulates values with given seed and accumulator function, passing through errors", () => {
    const recording = run(record =>
      F.sequentially(1, [1, 2, new F.Error("oops" as any), 3])
        .flatScan(0, add)
        .subscribe(record),
    )
    expect(recording).toMatchSnapshot()
  })

  it("yields the seed value immediately", () => {
    const recording = run(record => {
      F.sequentially(1, [1, 2, 3])
        .filter(() => false)
        .flatScan(0, add)
        .subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })

  it("remember it's state and continues from there after re-activation", () => {
    const recording = run((record, wait) => {
      const recordFirst = labeled(record, "first")
      const recordSecond = labeled(record, "sencond")
      const prop = F.sequentially(1, [1, 2, 3]).flatScan(0, add)
      prop.take(3).subscribe(recordFirst)
      recordFirst(Sync)
      wait(100, () => {
        prop.subscribe(recordSecond)
        recordSecond(Sync)
      })
    })
    expect(byLabel(recording)).toMatchSnapshot()
  })
})

describe("Property.flatScan", () => {
  it("results in Property", () => {
    expect(F.constant(1).flatScan(0, (s, a) => s + a)).toBeInstanceOf(F.Property)
  })

  it("with initial value, starts with f(seed, init),immediately", () => {
    const recording = run(record => {
      F.sequentially(1, [2, 3])
        .toProperty(1)
        .flatScan(0, add)
        .subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })

  it("without initial value, starts with seed, immediately", () => {
    const recording = run(record => {
      F.sequentially(1, [2, 3])
        .toProperty()
        .flatScan(0, add)
        .subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })

  it("works with synchronously responding empty source", () => {
    const recording = run(record => {
      F.never<number>()
        .toProperty(1)
        .flatScan(0, add)
        .subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })
})

function add(a: number, b: number): F.Observable<number> {
  return F.later(10, a + b)
}
