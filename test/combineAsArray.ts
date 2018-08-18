import * as F from "../src/bacon"
import { byLabel, labeled, run, Sync } from "./_base"

describe("F.combineAsArray", () => {
  const lol = F.constant("lol")
  const bal = F.constant("bal")

  it("emits Initial event synchronously if all combined values are properties with initial value", () => {
    const recording = run(record => {
      F.combineAsArray([lol, bal]).subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })

  it("does not return initial value if any of the items is EventStream", () => {
    const recording = run(record => {
      F.combineAsArray([lol, bal, F.once("tsers")])
        .startWith(["REAL INITIAL"])
        .subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })

  it("does not return initial value if all of the items are EventStreams", () => {
    const recording = run(record => {
      F.combineAsArray([F.once("tsers"), F.once("!")])
        .startWith(["REAL INITIAL"])
        .subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })

  it("process only events and passthroughs errors", () => {
    const recording = run(record =>
      F.combineAsArray(
        F.once("mkay"),
        F.sequentially(10, ["yeah", new F.Error("noes" as any), "hurray"]),
      ).subscribe(record),
    )
    expect(recording).toMatchSnapshot()
  })

  it("works with null values", () => {
    const recording = run(record => F.combineAsArray([null, null]).subscribe(record))
    expect(recording).toMatchSnapshot()
  })

  it("works with empty array", () => {
    const recording = run(record => F.combineAsArray([]).subscribe(record))
    expect(recording).toMatchSnapshot()
  })

  it("works with empty arg list", () => {
    const recording = run(record => F.combineAsArray().subscribe(record))
    expect(recording).toMatchSnapshot()
  })

  it("works with one item", () => {
    const recording = run(record => F.combineAsArray([lol]).subscribe(record))
    expect(recording).toMatchSnapshot()
  })

  it("works with arrays as values", () => {
    const recording = run(record => {
      F.combineAsArray(F.constant([]), F.constant(["a"])).subscribe(record)
      F.combineAsArray(F.constant(["b"]), F.constant([])).subscribe(record)
      F.combineAsArray(F.constant(["c1"]), F.constant(["c2"])).subscribe(record)
      F.combineAsArray(F.constant([]), F.constant([])).subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })

  it("allows mixing observables and non-observable values", () => {
    const recording = run(record =>
      F.combineAsArray(F.constant("foo"), "bar", 123, F.once("!")).subscribe(record),
    )
    expect(recording).toMatchSnapshot()
  })

  it("does not generate any glitches (follows transaction semantics)", () => {
    const recording = run(record => {
      const lower = F.fromArray(["a", "b", "c"]).toProperty()
      const upper = lower.map(l => l.toUpperCase())
      upper.subscribe(() => undefined)
      // both cases to ensure that order of items won't affect the transaction semantincs
      F.combineAsArray(lower, upper).subscribe(labeled(record, "lower-upper"))
      F.combineAsArray(upper, lower).subscribe(labeled(record, "upper-lower"))
    })
    expect(byLabel(recording)).toMatchSnapshot()
  })

  it("does not generate any glitches when nested", () => {
    const recording = run(record => {
      const lower = F.sequentially(10, ["a", "b", "c"]).toProperty()
      const upper = lower.map(l => l.toUpperCase())
      F.combineAsArray(
        F.combineAsArray(lower, F.once("!")),
        lower,
        upper,
        F.combineAsArray(upper, F.once("?")),
      ).subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })

  it("does not duplicate same error (follows transaction semantics)", () => {
    const recording = run(record => {
      const s = F.sequentially(1, ["mkay", new F.Error("noes" as any), "yay!"])
      F.combineAsArray(s, s).subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })

  it("remembers it's state (received values) between subscriptions", () => {
    const recording = run((record, wait) => {
      const combined = F.combineAsArray([
        F.once("foo"),
        F.once("bar"),
        F.sequentially(10, ["lol", "bal", "tsers"]),
      ])
      combined.take(2).subscribe(record)
      wait(100, () => {
        record("subscribe again...")
        combined.subscribe(record)
        record(Sync)
      })
    })
    expect(recording).toMatchSnapshot()
  })
})
