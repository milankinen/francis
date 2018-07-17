import * as F from "../bacon"
import { byLabel, labeled, run, Sync } from "./_base"

describe("EventStream.flatMapFirst", () => {
  it("results in EventStream", () => {
    expect(F.once("tsers").flatMapFirst(x => x + "!")).toBeInstanceOf(F.EventStream)
  })

  it("spawns new streams and ignores source events until current spawned stream has ended", () => {
    const recording = run((record, wait) => {
      const recordActivation = labeled(record, "activations")
      const recordEvent = labeled(record, "events")
      const makeInner = (num: number) =>
        F.fromBinder(sink => {
          recordActivation("activated: " + num)
          sink("inner: " + num)
          wait(18, () => sink(new F.End()))
          return () => recordActivation("disposed: " + num)
        })
      F.sequentially(10, [1, 2, 3, 4, 5])
        .flatMapFirst(i => makeInner(i))
        .subscribe(recordEvent)
    })
    expect(byLabel(recording)).toMatchSnapshot()
  })
})

describe("Property.flatMapFirst", () => {
  it("results in Property", () => {
    expect(F.constant("tsers").flatMapFirst(x => x + "!")).toBeInstanceOf(F.Property)
  })

  it("emit initial event synchronously if both inner and outer are sync", () => {
    const recording = run(record => {
      F.constant("tsers")
        .flatMapFirst(msg => F.constant(msg + "!"))
        .subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })

  it("works with same origin (follows transaction semantics)", () => {
    const recording = run(record => {
      const prop = F.sequentially(1, ["a", "b", "c"]).toProperty(">")
      prop.flatMapFirst(_ => prop).subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })

  it("works with derived same origin (follows transaction semantics)", () => {
    const recording = run(record => {
      const prop = F.sequentially(1, ["a", "b", "c"]).toProperty()
      prop.flatMapFirst(letter => prop.map(l => l.toUpperCase() + letter)).subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })
})
