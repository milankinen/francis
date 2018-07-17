import * as F from "../bacon"
import { run } from "./_base"

describe("F.map", () => {
  it("preserves mapped observable kind", () => {
    expect(F.constant("tsers").map(x => x + "!")).toBeInstanceOf(F.Property)
    expect(F.once("tsers").map(x => x + "!")).toBeInstanceOf(F.EventStream)
  })

  it("maps Next events with the given function and ignores Error events", () => {
    const recording = run(record =>
      F.fromArray(["lol", new F.Error("fuk" as any), "bal"])
        .map(x => x + "!")
        .subscribe(record),
    )
    expect(recording).toMatchSnapshot()
  })

  it("accepts constant value instead of function", () => {
    const recording = run(record =>
      F.fromArray(["lol", "bal"])
        .map("tsers" as any)
        .subscribe(record),
    )
    expect(recording).toMatchSnapshot()
  })

  it("can extract mapped value's property", () => {
    const recording = run(record =>
      F.once({ msg: "tsers" })
        .map(".msg" as any)
        .subscribe(record),
    )
    expect(recording).toMatchSnapshot()
  })

  it("can extract nested properties as well", () => {
    const recording = run(record =>
      F.once({ deep: { msg: "tsers" } })
        .map(".deep.msg" as any)
        .subscribe(record),
    )
    expect(recording).toMatchSnapshot()
  })

  it("worls also with computed properties", () => {
    const recording = run(record =>
      F.once([1, 2, 3])
        .map(".length" as any)
        .subscribe(record),
    )
    expect(recording).toMatchSnapshot()
  })

  it("can detect mapped value's method and call it", () => {
    const recording = run(record =>
      F.once({
        msg: "tsers",
        toS() {
          return this.msg + "!"
        },
      })
        .map(".toS" as any)
        .subscribe(record),
    )
    expect(recording).toMatchSnapshot()
  })

  it("allows partially appliable arguments for method calls", () => {
    const recording = run(record =>
      (F.once({
        msg: "tsers",
        toS(suffix: string) {
          return this.msg + suffix
        },
      }) as any)
        .map(".toS" as any, "??")
        .subscribe(record),
    )
    expect(recording).toMatchSnapshot()
  })

  it("works with method call on given object, with partial application", () => {
    const obj = { greet: (suffix: string, name: string) => "Hello " + name + suffix }
    const recording = run(record =>
      (F.fromArray(["Sir", "Francis"]) as any).map(obj as any, "greet", "!!").subscribe(record),
    )
    expect(recording).toMatchSnapshot()
  })

  it("can map to a Property value", () => {
    const val = F.constant("tsers")
    const recording = run(record =>
      F.fromArray([1, 2, 3])
        .map(val as any)
        .subscribe(record),
    )
    expect(recording).toMatchSnapshot()
  })
})
