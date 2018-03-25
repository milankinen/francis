import * as F from "../bacon"
import { runner, Sync } from "./_base"

describe("F.map", () => {
  it("maps Next events with the given function and ignores Error events", done => {
    runner()
      .setup(record =>
        F.fromArray(["lol", new F.Error("fuk" as any), "bal"])
          .map(x => x + "!")
          .subscribe(record),
      )
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("accepts constant value instead of function", done => {
    runner()
      .setup(record =>
        F.fromArray(["lol", "bal"])
          .map("tsers" as any)
          .subscribe(record),
      )
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("can extract mapped value's property", done => {
    runner()
      .setup(record =>
        F.once({ msg: "tsers" })
          .map(".msg" as any)
          .subscribe(record),
      )
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("can extract nested properties as well", done => {
    runner()
      .setup(record =>
        F.once({ deep: { msg: "tsers" } })
          .map(".deep.msg" as any)
          .subscribe(record),
      )
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("worls also with computed properties", done => {
    runner()
      .setup(record =>
        F.once([1, 2, 3])
          .map(".length" as any)
          .subscribe(record),
      )
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("can detect mapped value's method and call it", done => {
    runner()
      .setup(record =>
        F.once({
          msg: "tsers",
          toS() {
            return this.msg + "!"
          },
        })
          .map(".toS" as any)
          .subscribe(record),
      )
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("allows partially appliable arguments for method calls", done => {
    runner()
      .setup(record =>
        F.once({
          msg: "tsers",
          toS(suffix: string) {
            return this.msg + suffix
          },
        })
          .map(".toS" as any, "??")
          .subscribe(record),
      )
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("works with method call on given object, with partial application", done => {
    const obj = { greet: (name: string, suffix: string) => "Hello " + name + suffix }
    runner()
      .setup(record =>
        F.fromArray(["Sir", "Francis"])
          .map(obj as any, "greet", "!!")
          .subscribe(record),
      )
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("can map to a Property value", done => {
    const val = F.constant("tsers")
    runner()
      .setup(record =>
        F.fromArray([1, 2, 3])
          .map(val as any)
          .subscribe(record),
      )
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })
})
