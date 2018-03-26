import * as F from "../bacon"
import { runner, Sync } from "./_base"

describe("F.constant", () => {
  it("sends single event and ends", done => {
    runner()
      .setup(record => F.constant("tsers").subscribe(record))
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("is activated synchronously", done => {
    runner()
      .setup(record => {
        F.constant("tsers").subscribe(record)
        record(Sync)
      })
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })

  it("sends its value to every subscriber", done => {
    runner()
      .setup((record, wait) => {
        const prop = F.constant("tsers")
        prop.subscribe(x => record({ s: "a", x }))
        wait(100, () => prop.subscribe(x => record({ s: "b", x })))
      })
      .after(rec => expect(rec).toMatchSnapshot())
      .run(done)
  })
})
