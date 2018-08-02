import * as F from "../bacon"
import { byLabel, labeled, recordActivationAndDispose, run, Sync } from "./_base"

describe("EventStream.takeUntil", () => {
  it("results in EventStream", () => {
    expect(F.once(1).takeUntil(F.never())).toBeInstanceOf(F.EventStream)
  })

  it("takes elements from source until an event appears in the other stream", () => {
    const recording = run(record =>
      F.sequentially(3, [1, 2, 3])
        .takeUntil(F.later(7, "<stop>"))
        .subscribe(record),
    )
    expect(recording).toMatchSnapshot()
  })

  it("works on self-derived trigger", () => {
    const recording = run(record => {
      const s = F.sequentially(3, [3, 2, 1])
      s.takeUntil(s.filter(x => x < 3)).subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })

  // "evil twist" :D
  it("works on self-derived stopper with an evil twist", () => {
    const recording = run(record => {
      const s = F.sequentially(3, [3, 2, 1])
      s.map(x => x)
        .take(3)
        .onValue(() => {})
      s.takeUntil(s.filter(x => x < 3)).subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })

  it("includes source errors, ignores trigger errors", () => {
    const recording = run(record => {
      F.sequentially(2, [1, new F.Error("oops" as any), 2, 3, 4])
        .takeUntil(F.sequentially(4, [new F.Error("tsers" as any), 1]))
        .subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })

  it("works with Property as trigger", () => {
    const recording = run(record =>
      F.sequentially(3, [1, 2, 3])
        .takeUntil(F.later(7, "<stop>").toProperty())
        .subscribe(record),
    )
    expect(recording).toMatchSnapshot()
  })

  it("considers Property init value as trigger", () => {
    const recording = run(record =>
      F.sequentially(3, [1, 2, 3])
        .takeUntil(F.later(7, "<stop>").toProperty("tsers"))
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
        .takeUntil(recordActivationAndDispose(record, "trigger"))
        .subscribe(record),
    )
    expect(recording).toMatchSnapshot()
  })

  it("end properly when trigger produces value", () => {
    const recording = run((record, wait) =>
      recordActivationAndDispose(record, "source")
        .merge(F.once("tsers"))
        .takeUntil(
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

  it("remembers its end state", () => {
    const recording = run((record, wait) => {
      const s = F.sequentially(3, [1, 2, 3, 4, 5, 6, 7, 8]).takeUntil(F.later(10, true))
      s.subscribe(labeled(record, "first"))
      wait(100, () => {
        s.subscribe(labeled(record, "second"))
      })
    })
    expect(byLabel(recording)).toMatchSnapshot()
  })
})

describe("Property.takeUntil", () => {
  it("results in Property", () => {
    expect(F.constant(1).takeUntil(F.never())).toBeInstanceOf(F.Property)
  })

  it("works synchronously", () => {
    const recording = run(record => {
      F.sequentially(3, [1, 2, 3])
        .toProperty(0)
        .takeUntil(F.later(7, "<stop>"))
        .subscribe(record),
        record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })
})
