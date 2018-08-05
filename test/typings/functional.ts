import * as F from "../../src/index"
import { run } from "../_base"

describe("Francis functional interface", () => {
  it("supports curried ops and piping the curried ops", () => {
    const recording = run(record => {
      const recordStr = F.subscribe<string>(record)
      const recordStrObs = (obs: F.Observable<string>) => recordStr(obs)
      const every10ms = F.interval(10)
      const result = F.pipe(
        every10ms("!"),
        F.scan("TSERS", (sum, n) => sum + n),
        F.skip(1),
        F.take(5),
        F.map(s => s.toLowerCase()),
      )
      recordStrObs(result)
    })
    // actually the result is not so important, more important is that TS compiler won't break
    expect(recording).toMatchSnapshot()
  })
})
