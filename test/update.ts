import * as F from "../bacon"
import { run, Sync } from "./_base"

describe("F.update", () => {
  it("results in Property", () => {
    expect(F.update(0, [F.once(1)], (x: any, y: any) => x + y)).toBeInstanceOf(F.Property)
  })

  it("accumulates the state based on pattern matches", () => {
    const [t, s, e, r, _] = ["t", "s", "e", "r", "_"]
    const stream = (ex: string[]) => F.sequentially(1, ex).filter(x => x !== _)
    const join = (...args: any[]) => args.join("")
    // prettier-ignore
    const recording = run(record => {
      F.update("",
        [stream([t, _, _, _, _])], join,
        [stream([_, s, _, _, _])], join,
        [stream([_, _, _, r, _])], join,
        [stream([_, _, e, _, _])], join,
        [stream([_, _, _, _, s])], join,
      ).subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })
})
