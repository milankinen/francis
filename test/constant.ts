import * as F from "../bacon"
import { run, Sync } from "./_base"

describe("F.constant", () => {
  it("sends single event and ends", () => {
    const recording = run(record => F.constant("tsers").subscribe(record))
    expect(recording).toMatchSnapshot()
  })

  it("is activated synchronously", () => {
    const recording = run(record => {
      F.constant("tsers").subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })

  it("sends its value to every subscriber", () => {
    const recording = run((record, wait) => {
      const prop = F.constant("tsers")
      prop.subscribe(x => record({ s: "a", x }))
      wait(100, () => prop.subscribe(x => record({ s: "b", x })))
    })
    expect(recording).toMatchSnapshot()
  })
})
