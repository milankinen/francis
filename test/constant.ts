import * as B from "../src/bacon"
import { runner, Sync } from "./_base"

test("constant is sync", done => {
  runner()
    .setup(record => {
      B.constant("tsers").subscribe(record)
      record(Sync)
    })
    .after(rec => {
      expect(rec).toMatchSnapshot()
    })
    .run(done)
})

test("constant can be subscribed many times and subscribers always get the same value", done => {
  runner()
    .setup((record, wait) => {
      const prop = B.constant("tsers")
      prop.subscribe(x => record({ s: "a", x }))
      prop.subscribe(x => record({ s: "b", x }))
      wait(100, () => prop.subscribe(x => record({ s: "c", x })))
    })
    .after(rec => {
      expect(rec).toMatchSnapshot()
    })
    .run(done)
})
