import * as F from "../src/bacon"
import { byLabel, labeled, run } from "./_base"

describe("Observable.awaiting(obsevable)", () => {
  it("results in Property", () => {
    expect(F.once("foo").awaiting(F.once("bar"))).toBeInstanceOf(F.Property)
  })

  it("returns boolean indicating whether the observable is waiting another or not", () => {
    const recording = run(record => {
      F.sequentially(2, [1, 1])
        .awaiting(F.sequentially(3, [2]))
        .subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })

  it("supports awaiting Properties", () => {
    const recording = run(record => {
      F.sequentially(2, [1, 1])
        .awaiting(F.sequentially(3, [2]).toProperty())
        .subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })

  it("works with same origin", () => {
    const recording = run(record => {
      const case1 = F.later(1, "tsers")
      case1.awaiting(case1).subscribe(labeled(record, "case #1"))
      const case2 = F.later(1, "tsers")
      case2.awaiting(case2.map(_ => _)).subscribe(labeled(record, "case #2"))
      const case3 = F.later(1, "tsers")
      case3
        .map(_ => _)
        .awaiting(case3)
        .subscribe(labeled(record, "case #3"))
    })
    expect(byLabel(recording)).toMatchSnapshot()
  })
})

describe("Property.awaiting(property)", () => {
  it("works same as Observabe.awaiting(observable)", () => {
    const recording = run(record => {
      F.sequentially(2, [1, 1])
        .toProperty()
        .awaiting(F.sequentially(3, [2]).toProperty())
        .subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })

  it("works with same origin", () => {
    const recording = run(record => {
      const case1 = F.constant("tsers")
      case1.awaiting(case1).subscribe(labeled(record, "case #1"))
      const case2 = F.constant("tsers")
      case2.awaiting(case2.map(_ => _)).subscribe(labeled(record, "case #2"))
      const case3 = F.constant("tsers")
      case3
        .map(_ => _)
        .awaiting(case3)
        .subscribe(labeled(record, "case #3"))
    })
    expect(byLabel(recording)).toMatchSnapshot()
  })

  it("works with higher-order same origin", () => {
    const recording = run(record => {
      const src = F.constant("tsers")
      src.awaiting(src.flatMap(msg => F.once(msg))).subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })
})
