import * as F from "../bacon"
import { runner, Sync } from "./_base"

describe("EventStream.filter", () => {
  it("results in EventStream", () => {
    expect(F.once(1).filter(x => x > 0)).toBeInstanceOf(F.EventStream)
    expect(F.once(1).filter(F.constant("tsers"))).toBeInstanceOf(F.EventStream)
  })

  it("filters values based on given predicate's return value truthiness", done => {
    runner()
      .setup(record =>
        F.fromArray([1, 0, true, false, "tsers", "", null])
          .filter(x => x as any)
          .subscribe(record),
      )
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("passthroughs errors", done => {
    runner()
      .setup(record =>
        F.fromArray([1, new F.Error("" as any), 0, 2])
          .filter(x => !!x)
          .subscribe(record),
      )
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("can filter by property value", done => {
    runner()
      .setup(record =>
        F.sequentially(5, [0, 1, 2, 0, 3, 4])
          .filter(F.later(18, true).toProperty(false))
          .subscribe(record),
      )
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("accepts property extractor string (follows function construction rules)", done => {
    runner()
      .setup(record =>
        F.fromArray([[1], [], [2, 3]])
          .filter(".length" as any)
          .subscribe(record),
      )
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })
})

describe("Property.filter", () => {
  it("results in Property", () => {
    expect(F.constant(1).filter(x => x > 0)).toBeInstanceOf(F.Property)
    expect(F.constant(1).filter(F.constant("tsers"))).toBeInstanceOf(F.Property)
  })

  it("filters values based on given predicate's return value truthiness", done => {
    runner()
      .setup(record =>
        F.fromArray([1, 0, true, false, "tsers", "", null])
          .toProperty({} as any)
          .filter(x => x as any)
          .subscribe(record),
      )
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })
})
