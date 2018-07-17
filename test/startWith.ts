import * as F from "../bacon"
import { run, Sync } from "./_base"

describe("F.startWith", () => {
  describe("applied to Property", () => {
    it("emits synchronous initial event for property having no initial event", () => {
      const recording = run(record => {
        F.once("tsers")
          .toProperty()
          .startWith("initial")
          .subscribe(record)
        record(Sync)
      })
      expect(recording).toMatchSnapshot()
    })

    it("doesn't emit anything if Property already has an initial event", () => {
      const recording = run(record =>
        F.constant("tsers")
          .startWith("initial")
          .subscribe(record),
      )
      expect(recording).toMatchSnapshot()
    })
  })
})
