import * as F from "../bacon"
import { run } from "./_base"

describe("F.combineTemplate", () => {
  it("results in Property", () => {
    expect(F.combineTemplate({})).toBeInstanceOf(F.Property)
  })

  it("transforms every value from the given template object into plain value", () => {
    const recording = run(record =>
      F.combineTemplate({
        bar: { num: 10, msg: F.constant("tsers!"), nested: { num: 123 } },
        foo: F.sequentially(2, ["lol", "bal"]),
        lol: [1, 2, 3],
      }).subscribe(record),
    )
    expect(recording).toMatchSnapshot()
  })

  it("works with zero observables in the template", () => {
    const recording = run(record => F.combineTemplate({ lol: "bal" }).subscribe(record))
    expect(recording).toMatchSnapshot()
  })

  it("has working typings", () => {
    const recording = run(record =>
      F.combineTemplate({
        bar: { num: 10, msg: F.constant("tsers!"), nested: { num: 123 } },
        foo: F.sequentially(2, ["lol", "bal"]),
        lol: [1, 2, 3],
      })
        .map(x => ({
          // compiler should not give any errors on these
          barMsg: x.bar.msg.toUpperCase(),
          barNestedNum: x.bar.nested.num + 2,
          firstLol: x.lol[0],
        }))
        .subscribe(record),
    )
    expect(recording).toMatchSnapshot()
  })
})
