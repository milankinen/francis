import * as F from "../src/bacon"
import { run, Sync } from "./_base"

describe("F.repeatedly", () => {
  it("repeats the given event sequence infinitely", () => {
    const recording = run((record, _, now) => {
      const t = now()
      F.repeatedly(3, [1, 2, new F.Error("tsers" as any), 3])
        .take(10)
        .subscribe(event => record({ tick: now() - t, event }))
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })
})
