import * as F from "../bacon"
import { run, Sync } from "./_base"

describe("F.fromBinder", () => {
  it("results in EventStream", () => {
    expect(F.fromBinder(() => {})).toBeInstanceOf(F.EventStream)
  })

  it("calls subscribe function when stream is activated, asynchronously", () => {
    const recording = run(record => {
      F.fromBinder(_ => record("activated")).subscribe(() => {})
      record(Sync)
    })
    expect(recording).toEqual([Sync, "activated"])
  })

  it("calls subscribe function only for first subscriber", () => {
    const recording = run((record, wait) => {
      const s = F.fromBinder(_ => record("activated"))
      s.toProperty("first").subscribe(record)
      wait(10, () => s.toProperty("second").subscribe(record))
    })
    expect(recording).toMatchSnapshot()
  })

  it("can be activated multiple times", () => {
    const recording = run((record, wait) => {
      const s = F.fromBinder(_ => record("activated"))
      const disposeFirst = s.subscribe(() => {})
      wait(10, disposeFirst)
      wait(20, () => s.subscribe(() => {}))
    })
    expect(recording).toEqual(["activated", "activated"])
  })

  it("allows sending unwrapped next events", () => {
    const recording = run(record => F.fromBinder(sink => sink("tsers")).subscribe(record))
    expect(recording).toMatchSnapshot()
  })

  it("allows sending wrapped events", () => {
    const recording = run(record =>
      F.fromBinder(sink => {
        sink(new F.Next("tsers"))
        sink(new F.Error("fuk" as any))
        sink(new F.End())
      }).subscribe(record),
    )
    expect(recording).toMatchSnapshot()
  })

  it("allows sending batch of events by giving an array to sink", () => {
    const recording = run(record =>
      F.fromBinder(sink => sink(["tsers", new F.Error("fuk" as any), new F.End()])).subscribe(
        record,
      ),
    )
    expect(recording).toMatchSnapshot()
  })

  it("returns noMore from sink when stream ends", () => {
    const recording = run(record =>
      F.fromBinder(sink => {
        record(sink("tsers"))
        record(sink("tsers"))
        record(sink("tsers"))
      })
        .take(2)
        .subscribe(() => {}),
    )
    expect(recording).toMatchSnapshot()
  })

  it("returns noMore if F.End is given to sink", () => {
    const recording = run(record =>
      F.fromBinder(sink => record(sink(new F.End()))).subscribe(() => {}),
    )
    expect(recording).toMatchSnapshot()
  })

  it("does not call dispose function if stream does not end or is not disposed", () => {
    const recording = run(record =>
      F.fromBinder(sink => () => record("disposed")).subscribe(() => {}),
    )
    expect(recording).toEqual([])
  })

  it("calls dispose function when stream ends", () => {
    const recording = run(record =>
      F.fromBinder(sink => {
        sink(["tsers", "tsers", "tsers"])
        return () => record("disposed")
      })
        .take(2)
        .subscribe(() => {}),
    )
    expect(recording).toEqual(["disposed"])
  })

  it("calls dispose function if user disposes the stream", () => {
    const recording = run((record, wait) => {
      const dispose = F.fromBinder(sink => () => record("disposed")).subscribe(() => {})
      wait(10, () => dispose())
    })
    expect(recording).toEqual(["disposed"])
  })

  it("calls dispose function if subscribe function emits F.End", () => {
    const recording = run(record =>
      F.fromBinder(sink => {
        sink(new F.End())
        return () => record("disposed")
      }).subscribe(() => {}),
    )
    expect(recording).toEqual(["disposed"])
  })
})
