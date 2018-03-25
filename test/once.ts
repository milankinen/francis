import * as B from "../src/bacon"
import { runner, Sync } from "./_base"

test("once is async", done => {
  runner()
    .setup(record => {
      B.once("tsers").subscribe(record)
      record(Sync)
    })
    .after(rec => {
      expect(rec).toMatchSnapshot()
    })
    .run(done)
})

test("once is multicasted", done => {
  runner()
    .setup(record => {
      const stream = B.once("tsers")
      stream.subscribe(x => record({ s: "a", x }))
      stream.subscribe(x => record({ s: "b", x }))
    })
    .after(rec => {
      expect(rec).toMatchSnapshot()
    })
    .run(done)
})

test("once emits its value only one time", done => {
  runner()
    .setup((record, wait) => {
      const stream = B.once("tsers")
      stream.subscribe(x => record({ s: "a", x }))
      wait(100, () => stream.subscribe(x => record({ s: "b", x })))
    })
    .after(rec => {
      expect(rec).toMatchSnapshot()
    })
    .run(done)
})
