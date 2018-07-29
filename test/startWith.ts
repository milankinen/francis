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

  describe("applied to EventStream", () => {
    it("preprends the start value to stream", () => {
      const recording = run(record => {
        F.fromArray([1, 2, 3])
          .startWith(0)
          .subscribe(record)
        record(Sync)
      })
      expect(recording).toMatchSnapshot()
    })

    it("works in inner scheduling contexts (inside flatMap**) as well", () => {
      const recording = run(record => {
        F.fromArray(["lol", "bal"])
          .flatMapLatest(x =>
            F.fromArray([1, 2])
              .startWith(0)
              .map(y => x + " " + y),
          )
          .subscribe(record)
        record(Sync)
      })
      expect(recording).toMatchSnapshot()
    })
  })
})
