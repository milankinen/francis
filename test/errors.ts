import * as F from "../src/bacon"
import { run } from "./_base"

describe("EventStream.errors", () => {
  it("results in EventStream", () => {
    expect(F.once(1).errors()).toBeInstanceOf(F.EventStream)
  })

  it("passes only errors", () => {
    const recording = run(record =>
      F.sequentially(1, [1, 2, new F.Error("tsers" as any), 3, 4, new F.Error("fuk" as any), 5])
        .errors()
        .subscribe(record),
    )
    expect(recording).toMatchSnapshot()
  })
})

describe("Property.errors", () => {
  it("results in Property", () => {
    expect(F.constant(1).errors()).toBeInstanceOf(F.Property)
  })

  it("passes only errors", () => {
    const recording = run(record =>
      F.sequentially(1, [1, 2, new F.Error("tsers" as any), 3, 4, new F.Error("fuk" as any), 5])
        .toProperty(0)
        .errors()
        .subscribe(record),
    )
    expect(recording).toMatchSnapshot()
  })
})
