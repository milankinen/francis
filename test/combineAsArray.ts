import * as R from "ramda"
import * as F from "../bacon"
import { runner, Sync } from "./_base"

describe("F.combineAsArray", () => {
  const lol = F.constant("lol")
  const bal = F.constant("bal")

  it("emits Initial event synchronously if all combined values are properties with initial value", done => {
    runner()
      .setup(record => {
        F.combineAsArray([lol, bal]).subscribe(record)
        record(Sync)
      })
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("does not return initial value if any of the items is EventStream", done => {
    runner()
      .setup(record => {
        F.combineAsArray([lol, bal, F.once("tsers")])
          .startWith(["REAL INITIAL"])
          .subscribe(record)
        record(Sync)
      })
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("does not return initial value if all of the items are EventStreams", done => {
    runner()
      .setup(record => {
        F.combineAsArray([F.once("tsers"), F.once("!")])
          .startWith(["REAL INITIAL"])
          .subscribe(record)
        record(Sync)
      })
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("process only events and passthroughs errors", done => {
    runner()
      .setup(record =>
        F.combineAsArray(
          F.once("mkay"),
          F.sequentially(10, ["yeah", new F.Error("noes" as any), "hurray"]),
        ).subscribe(record),
      )
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("works with null values", done => {
    runner()
      .setup(record => F.combineAsArray([null, null]).subscribe(record))
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("works with empty array", done => {
    runner()
      .setup(record => F.combineAsArray([]).subscribe(record))
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("works with empty arg list", done => {
    runner()
      .setup(record => F.combineAsArray().subscribe(record))
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("works with one item", done => {
    runner()
      .setup(record => F.combineAsArray([lol]).subscribe(record))
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("works with arrays as values", done => {
    runner()
      .setup(record => {
        F.combineAsArray(F.constant([]), F.constant(["a"])).subscribe(record)
        F.combineAsArray(F.constant(["b"]), F.constant([])).subscribe(record)
        F.combineAsArray(F.constant(["c1"]), F.constant(["c2"])).subscribe(record)
        F.combineAsArray(F.constant([]), F.constant([])).subscribe(record)
      })
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("allows mixing observables and non-observable values", done => {
    runner()
      .setup(record =>
        F.combineAsArray(F.constant("foo"), "bar", 123, F.once("!")).subscribe(record),
      )
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("does not generate any glitches (follows transaction semantics)", done => {
    runner()
      .setup(record => {
        const lower = F.fromArray(["a", "b", "c"]).toProperty()
        const upper = lower.map(l => l.toUpperCase())
        upper.subscribe(() => undefined)
        // both cases to ensure that order of items won't affect the transaction semantincs
        F.combineAsArray(lower, upper).subscribe(x => record({ name: "lower-upper", x }))
        F.combineAsArray(upper, lower).subscribe(x => record({ name: "upper-lower", x }))
      })
      .after(rec => {
        const result = R.map(R.map(R.prop("x")), R.groupBy(R.prop("name") as any, rec))
        expect(result).toMatchSnapshot()
      })
      .run(done)
  })

  it("does not generate any glitches when nested", done => {
    runner()
      .setup(record => {
        const lower = F.sequentially(10, ["a", "b", "c"]).toProperty()
        const upper = lower.map(l => l.toUpperCase())
        F.combineAsArray(
          F.combineAsArray(lower, F.once("!")),
          lower,
          upper,
          F.combineAsArray(upper, F.once("?")),
        ).subscribe(record)
      })
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("does not duplicate same error (follows transaction semantics)", done => {
    runner()
      .setup(record => {
        const s = F.sequentially(1, ["mkay", new F.Error("noes" as any), "yay!"])
        F.combineAsArray(s, s).subscribe(record)
      })
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })
})
