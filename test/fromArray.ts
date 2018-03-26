import * as F from "../bacon"
import { runner, Sync } from "./_base"

describe("F.fromArray", () => {
  it("sends single event and ends", done => {
    runner()
      .setup(record => F.fromArray(["lol", "bal"]).subscribe(record))
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("is activated asynchronously", done => {
    runner()
      .setup(record => {
        const stream = F.fromArray(["lol", "bal"])
        stream.subscribe(x => record({ s: "a", x }))
        stream.subscribe(x => record({ s: "b", x }))
        record(Sync)
      })
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("sends its value only one time", done => {
    runner()
      .setup((record, wait) => {
        const stream = F.fromArray(["lol", "bal"])
        stream.subscribe(x => record({ s: "a", x }))
        wait(100, () => stream.subscribe(x => record({ s: "b", x })))
      })
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("supports event wrappers such as Next and Error", done => {
    runner()
      .setup(record =>
        F.fromArray([new F.Next("lol"), new F.Error("fuk" as any), "bal"]).subscribe(record),
      )
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })
})
