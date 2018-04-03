import * as F from "../bacon"
import { runner, Sync } from "./_base"

describe("EventStream.first", () => {
  it("results in EventStream", () => {
    expect(F.once(1).first()).toBeInstanceOf(F.EventStream)
  })

  it("takes first event and ends", done => {
    runner()
      .setup(
        record =>
          F.fromArray([1, 2, 3, 4])
            .first()
            .subscribe(record) && record(Sync),
      )
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })
})

describe("Property.first", () => {
  it("results in Property", () => {
    expect(F.constant(1).first()).toBeInstanceOf(F.Property)
  })

  it("takes first event and ends", done => {
    runner()
      .setup(
        record =>
          F.fromArray([1, 2, 3, 4])
            .toProperty(0)
            .first()
            .subscribe(record) && record(Sync),
      )
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })
})
