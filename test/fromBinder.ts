import * as F from "../bacon"
import { runner, Sync } from "./_base"

describe("F.fromBinder", () => {
  it("results in EventStream", () => {
    expect(F.fromBinder(() => {})).toBeInstanceOf(F.EventStream)
  })

  it("calls subscribe function when stream is activated, asynchronously", done => {
    runner()
      .setup(record => {
        F.fromBinder(_ => record("activated")).subscribe(() => {})
        record(Sync)
      })
      .after(rec => expect(rec).toEqual([Sync, "activated"]))
      .run(done)
  })

  it("calls subscribe function only for first subscriber", done => {
    runner()
      .setup((record, wait) => {
        const s = F.fromBinder(_ => record("activated"))
        s.toProperty("first").subscribe(record)
        wait(10, () => s.toProperty("second").subscribe(record))
      })
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("can be activated multiple times", done => {
    runner()
      .setup((record, wait) => {
        const s = F.fromBinder(_ => record("activated"))
        const disposeFirst = s.subscribe(() => {})
        wait(10, disposeFirst)
        wait(20, () => s.subscribe(() => {}))
      })
      .after(rec => expect(rec).toEqual(["activated", "activated"]))
      .run(done)
  })

  it("allows sending unwrapped next events", done => {
    runner()
      .setup(record => F.fromBinder(sink => sink("tsers")).subscribe(record))
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("allows sending wrapped events", done => {
    runner()
      .setup(record =>
        F.fromBinder(sink => {
          sink(new F.Next("tsers"))
          sink(new F.Error("fuk" as any))
          sink(new F.End())
        }).subscribe(record),
      )
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("allows sending batch of events by giving an array to sink", done => {
    runner()
      .setup(record =>
        F.fromBinder(sink => sink(["tsers", new F.Error("fuk" as any), new F.End()])).subscribe(
          record,
        ),
      )
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("returns noMore from sink when stream ends", done => {
    runner()
      .setup(record =>
        F.fromBinder(sink => {
          record(sink("tsers"))
          record(sink("tsers"))
          record(sink("tsers"))
        })
          .take(2)
          .subscribe(() => {}),
      )
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("returns noMore if F.End is given to sink", done => {
    runner()
      .setup(record => F.fromBinder(sink => record(sink(new F.End()))).subscribe(() => {}))
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("does not call dispose function if stream does not end or is not disposed", done => {
    runner()
      .setup(record => F.fromBinder(sink => () => record("disposed")).subscribe(() => {}))
      .after(rec => expect(rec).toEqual([]))
      .run(done)
  })

  it("calls dispose function when stream ends", done => {
    runner()
      .setup(record =>
        F.fromBinder(sink => {
          sink(["tsers", "tsers", "tsers"])
          return () => record("disposed")
        })
          .take(2)
          .subscribe(() => {}),
      )
      .after(rec => expect(rec).toEqual(["disposed"]))
      .run(done)
  })

  it("calls dispose function if user disposes the stream", done => {
    runner()
      .setup((record, wait) => {
        const dispose = F.fromBinder(sink => () => record("disposed")).subscribe(() => {})
        wait(10, () => dispose())
      })
      .after(rec => expect(rec).toEqual(["disposed"]))
      .run(done)
  })

  it("calls dispose function if subscribe function emits F.End", done => {
    runner()
      .setup(record =>
        F.fromBinder(sink => {
          sink(new F.End())
          return () => record("disposed")
        }).subscribe(() => {}),
      )
      .after(rec => expect(rec).toEqual(["disposed"]))
      .run(done)
  })
})
