import * as F from "../bacon"
import { run } from "./_base"

describe("F.repeat", () => {
  it("polls new streams from generator function until empty result", () => {
    const recording = run(record => {
      F.repeat(i => i < 3 && F.later(1, i + 1)).subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })

  it("works with synchronous streams", () => {
    const recording = run(record => {
      F.repeat(i => i < 3 && F.once(i + 1)).subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })

  it("does not cause stack overflow", () => {
    const recording = run(record => {
      F.repeat(_ => F.once("tsers"))
        .take(3000)
        .filter(() => false)
        .subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })

  it("does not mess up transcation semantics", () => {
    const recording = run(record => {
      const s = F.sequentially(1, ["a", "b", "c"]).toProperty()
      F.repeat(i => i === 0 && F.combineAsArray(s, s.map(x => x + "!"), s.map(x => x + "?")))
        .combine(s.map(x => x.toUpperCase()), (a, b) => [a, b])
        .subscribe(record)
    })
    expect(recording).toMatchSnapshot()
  })
})
