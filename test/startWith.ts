import * as F from "../bacon"
import { runner, Sync } from "./_base"

describe("F.startWith", () => {
  describe("applied to Property", () => {
    it("emits synchronous initial event for property having no initial event", done => {
      runner()
        .setup(record => {
          F.once("tsers")
            .toProperty()
            .startWith("initial")
            .subscribe(record)
          record(Sync)
        })
        .after(rec => expect(rec).toMatchSnapshot())
        .run(done)
    })

    it("doesn't emit anything if Property already has an initial event", done => {
      runner()
        .setup(record => F.constant("tsers").subscribe(record))
        .after(rec => expect(rec).toMatchSnapshot())
        .run(done)
    })
  })
})
