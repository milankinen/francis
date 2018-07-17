import * as F from "../bacon"
import { run, Sync } from "./_base"

describe("F.fromArray", () => {
  it("sends single event and ends", () => {
    const recording = run(record => F.fromArray(["lol", "bal"]).subscribe(record))
    expect(recording).toMatchSnapshot()
  })

  it("is activated asynchronously", () => {
    const recording = run(record => {
      const stream = F.fromArray(["lol", "bal"])
      stream.subscribe(x => record({ s: "a", x }))
      stream.subscribe(x => record({ s: "b", x }))
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })

  it("sends its value only one time", () => {
    const recording = run((record, wait) => {
      const stream = F.fromArray(["lol", "bal"])
      stream.subscribe(x => record({ s: "a", x }))
      wait(100, () => stream.subscribe(x => record({ s: "b", x })))
    })
    expect(recording).toMatchSnapshot()
  })

  it("supports event wrappers such as Next and Error", () => {
    const recording = run(record =>
      F.fromArray([new F.Next("lol"), new F.Error("fuk" as any), "bal"]).subscribe(record),
    )
    expect(recording).toMatchSnapshot()
  })
})
