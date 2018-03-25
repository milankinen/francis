import * as B from "../src/bacon"
import { runner, Sync } from "./_base"

test("fromArray is async", done => {
  runner()
    .setup(record => {
      B.fromArray(["lol", "bal"]).subscribe(record)
      record(Sync)
    })
    .after(rec => {
      expect(rec).toMatchSnapshot()
    })
    .run(done)
})

test("fromArray is multicasted", done => {
  runner()
    .setup(record => {
      const stream = B.fromArray(["lol", "bal"])
      stream.subscribe(x => record({ s: "a", x }))
      stream.subscribe(x => record({ s: "b", x }))
    })
    .after(rec => {
      expect(rec).toMatchSnapshot()
    })
    .run(done)
})

test("fromArray emits its value only one time", done => {
  runner()
    .setup((record, wait) => {
      const stream = B.fromArray(["lol", "bal"])
      stream.subscribe(x => record({ s: "a", x }))
      wait(100, () => stream.subscribe(x => record({ s: "b", x })))
    })
    .after(rec => {
      expect(rec).toMatchSnapshot()
    })
    .run(done)
})
