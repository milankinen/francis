import * as F from "../src/bacon"
import { recordActivationAndDispose, run, Sync } from "./_base"

describe("EventStream.skipUntil", () => {
  it("results in EventStream", () => {
    expect(F.once(1).skipUntil(F.never())).toBeInstanceOf(F.EventStream)
  })

  it("skips events until one appears in given trigger stream", () => {
    const recording = run(record =>
      F.sequentially(3, [1, 2, 3])
        .skipUntil(F.later(4, "<start>"))
        .subscribe(record),
    )
    expect(recording).toMatchSnapshot()
  })

  it("works on self-derived trigger", () => {
    const recording = run(record => {
      const s = F.sequentially(3, [1, 2, 3])
      s.skipUntil(s.filter(x => x === 3)).subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })

  // "evil twist" :D
  it("works on self-derived stopper with an evil twist", () => {
    const recording = run(record => {
      const s = F.sequentially(3, [1, 2, 3])
      s.map(x => x)
        .take(3)
        .onValue(() => {})
      s.skipUntil(s.filter(x => x === 3)).subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })

  it("includes source errors, ignores trigger errors", () => {
    const recording = run(record => {
      F.sequentially(2, [1, new F.Error("oops" as any), 2, 3, 4])
        .skipUntil(F.sequentially(4, [new F.Error("tsers" as any), 1]))
        .subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })

  it("works with Property as trigger", () => {
    const recording = run(record =>
      F.sequentially(3, [1, 2, 3])
        .skipUntil(F.later(7, "<start>").toProperty())
        .subscribe(record),
    )
    expect(recording).toMatchSnapshot()
  })

  it("considers Property init value as trigger", () => {
    const recording = run(record =>
      F.sequentially(3, [1, 2, 3])
        .skipUntil(F.later(7, "<start>").toProperty("tsers"))
        .subscribe(record),
    )
    expect(recording).toMatchSnapshot()
  })

  it("ends properly when source ends", () => {
    const recording = run((record, wait) =>
      F.fromBinder(sink => {
        record("activate: source")
        wait(10, () => {
          sink(1)
          sink(2)
          sink(new F.End())
        })
        return () => {
          record("dispose: source")
        }
      })
        .skipUntil(recordActivationAndDispose(record, "trigger"))
        .subscribe(record),
    )
    expect(recording).toMatchSnapshot()
  })

  it("end properly when trigger produces value", () => {
    const recording = run((record, wait) =>
      recordActivationAndDispose(record, "source")
        .merge(F.once("tsers"))
        .skipUntil(
          F.fromBinder(sink => {
            record("activate: trigger")
            wait(10, () => sink("stop!"))
            return () => record("dispose: trigger")
          }),
        )
        .subscribe(record),
    )
    expect(recording).toMatchSnapshot()
  })
})

describe("Property.skipUntil", () => {
  it("results in Property", () => {
    expect(F.constant(1).skipUntil(F.never())).toBeInstanceOf(F.Property)
  })

  it("works synchronously", () => {
    const recording = run(record => {
      F.sequentially(3, [1, 2, 3])
        .toProperty(0)
        .skipUntil(F.later(7, "<start>").toProperty("tsers"))
        .subscribe(record),
        record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })
})
