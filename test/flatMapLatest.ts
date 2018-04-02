import * as F from "../bacon"
import { runner, Sync } from "./_base"

describe("EventStream.flatMapLatest", () => {
  it("results in EventStream", () => {
    expect(F.once("tsers").flatMapLatest(x => x + "!")).toBeInstanceOf(F.EventStream)
  })

  it("uses the events from the latest inner stream only", done => {
    runner()
      .setup(record => {
        const a = F.sequentially(5, ["1", "2", "3"])
        const b = F.sequentially(5, ["a", "b", "c"])
        F.sequentially(12, [1, 2])
          .flatMapLatest(i => (i === 1 ? a : b))
          .subscribe(record)
      })
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("does not re-activate inner stream if it does not change", done => {
    runner()
      .setup((record, wait) => {
        const inner = F.fromBinder(_ => {
          record("inner activated")
          return () => record("inner disposed")
        }).toProperty("tsers")
        const dispose = F.sequentially(1, [1, 2, 3, 4])
          .flatMapLatest(_ => inner)
          .subscribe(() => {})
        wait(50, dispose)
      })
      .after(rec => expect(rec).toEqual(["inner activated", "inner disposed"]))
      .run(done)
  })

  it("does not end if the latest inner stream does not end", done => {
    runner()
      .setup(record => {
        F.once("tsers")
          .flatMapLatest(msg => neverEnding(msg))
          .subscribe(record)
      })
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("does not end if the outer stream does not end", done => {
    runner()
      .setup(record => {
        neverEnding("tsers")
          .flatMapLatest(msg => F.once(msg))
          .subscribe(record)
      })
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("disposes previous inner stream properly", done => {
    runner()
      .setup(record => {
        const makeInner = (num: number) =>
          F.fromBinder(_ => {
            record("activated: " + num)
            return () => record("disposed: " + num)
          })
        F.sequentially(1, [1, 2, 3, 4])
          .flatMapLatest(i => makeInner(i))
          .subscribe(() => {})
      })
      .after(rec =>
        expect(rec).toEqual([
          "activated: 1",
          "disposed: 1",
          "activated: 2",
          "disposed: 2",
          "activated: 3",
          "disposed: 3",
          "activated: 4",
          // 4th inner stream is not disposed because outer stream ends
        ]),
      )
      .run(done)
  })
})

describe("Property.flatMapLatest", () => {
  it("results in Property", () => {
    expect(F.constant("tsers").flatMapLatest(x => x + "!")).toBeInstanceOf(F.Property)
  })

  it("emits its inner events synchronously", done => {
    runner()
      .setup(record => {
        F.constant("tsers")
          .flatMapLatest(msg => F.constant(msg + "!"))
          .subscribe(record)
        record(Sync)
      })
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("emits initial value only once", done => {
    runner()
      .setup(record =>
        F.once(1)
          .toProperty(0)
          .flatMapLatest(x => x)
          .subscribe(record),
      )
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("does not emit initial value if inner observable does not emit initial valu", done => {
    runner()
      .setup(record =>
        F.constant("tsers")
          .flatMapLatest(msg => F.once(msg).toProperty())
          .subscribe(record),
      )
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("works with same origin (follows transaction semantics)", done => {
    runner()
      .setup(record => {
        const prop = F.sequentially(1, ["a", "b", "c"]).toProperty(">")
        prop.flatMapLatest(_ => prop).subscribe(record)
      })
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("works with derived same origin (follows transaction semantics)", done => {
    runner()
      .setup(record => {
        const prop = F.sequentially(1, ["a", "b", "c"]).toProperty()
        prop.flatMapLatest(letter => prop.map(l => l.toUpperCase() + letter)).subscribe(record)
      })
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("works with nested combines (follows transaction semantics)", done => {
    runner()
      .setup(record => {
        const lower = F.sequentially(2, ["a", "b"]).toProperty(">")
        const upper = lower.map(l => l.toUpperCase())
        const under = lower.map(l => "_" + l + "_")
        const all = lower.flatMapLatest(l => F.combineAsArray(l, upper, under))
        F.combineAsArray(upper, all).subscribe(record)
      })
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })
})

function neverEnding<T>(val: T): F.EventStream<T> {
  return F.fromBinder(sink => {
    sink(val)
  })
}
