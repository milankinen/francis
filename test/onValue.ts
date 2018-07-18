import * as F from "../bacon"
import { run } from "./_base"

describe("Observable.onValue", () => {
  it("invokes the handler function only for values", () => {
    const recording = run(record =>
      F.fromArray(["lol", new F.Error("oops" as any), "bal"]).onValue(record),
    )
    expect(recording).toMatchSnapshot()
  })
})
