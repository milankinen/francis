import * as F from "../bacon"
import { byLabel, labeled, runner, Sync } from "./_base"

describe("EventStream.take", () => {
  it("results in EventStream", () => {
    expect(F.once(1).take(1)).toBeInstanceOf(F.EventStream)
  })

  it("takes first N elements", done => {
    runner()
      .setup(
        record =>
          F.fromArray([1, 2, 3, 4])
            .take(2)
            .subscribe(record) && record(Sync),
      )
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("works with N=0", done => {
    runner()
      .setup(
        record =>
          F.fromArray([1, 2, 3, 4])
            .take(0)
            .subscribe(record) && record(Sync),
      )
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("is stateful", done => {
    runner()
      .setup((record, wait) => {
        const stream = F.fromArray([1, 2, 3, 4]).take(2)
        stream.subscribe(labeled(record, "first"))
        wait(10, () => stream.subscribe(labeled(record, "second")))
      })
      .after(rec => expect(byLabel(rec)).toMatchSnapshot())
      .run(done)
  })

  it("passthroughs errors", done => {
    runner()
      .setup(record =>
        F.fromArray([1, new F.Error("fuk" as any), 2, 3, 4])
          .take(3)
          .subscribe(record),
      )
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })
})

describe("Property.take", () => {
  it("results in Property", () => {
    expect(F.constant(1).take(1)).toBeInstanceOf(F.Property)
  })

  it("can take initial event", done => {
    runner()
      .setup(record =>
        F.fromArray([1, 2, 3, 4])
          .toProperty(0)
          .take(2)
          .subscribe(record),
      )
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("takes N next events if inital event is not present", done => {
    runner()
      .setup(record =>
        F.fromArray([1, 2, 3, 4])
          .toProperty()
          .take(2)
          .subscribe(record),
      )
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("is stateful but returns latest taken value to late subscribers", done => {
    runner()
      .setup((record, wait) => {
        const prop = F.fromArray([1, 2, 3, 4])
          .toProperty()
          .take(2)
        prop.subscribe(labeled(record, "first"))
        wait(10, () => prop.subscribe(labeled(record, "second")))
      })
      .after(rec => expect(byLabel(rec)).toMatchSnapshot())
      .run(done)
  })
})
