import * as R from "ramda"
import * as F from "../src/index"
import { run, Sync } from "./_base"

// tslint:disable-next-line:no-var-requires
const L = require("partial.lenses")

describe("F.Atom", () => {
  it("implements Property", () => {
    const atom = F.atom("tsers")
    expect(atom).toBeInstanceOf(F.Property)
    expect(atom).toBeInstanceOf(F.Atom)
  })

  it("has a state that can be modified", () => {
    const atom = F.atom("tsers")
    expect(F.get(atom)).toEqual("tsers")
    F.modify(atom, s => s.toUpperCase())
    expect(F.get(atom)).toEqual("TSERS")
    F.set(atom, "lolbal")
    expect(F.get(atom)).toEqual("lolbal")
  })

  it("supports state slicing by property name", () => {
    const atom = F.atom({ foo: 123, bar: "tsers" })
    const foo = F.view(atom, "foo")
    expect(F.get(foo)).toEqual(123)
    F.modify(foo, x => x + 1)
    expect(F.get(foo)).toEqual(124)
    expect(F.get(atom)).toEqual({ foo: 124, bar: "tsers" })
  })

  it("supports state slicing by object lens", () => {
    const initial = { foo: 123, bar: "tsers" }
    const lens = {
      get(s: typeof initial): number {
        return s.foo
      },
      set(n: number, s: typeof initial): typeof initial {
        return { ...s, foo: n }
      },
    }
    const atom = F.atom({ foo: 123, bar: "tsers" })
    const foo = F.view(atom, lens)
    expect(F.get(foo)).toEqual(123)
    F.modify(foo, x => x + 1)
    expect(F.get(foo)).toEqual(124)
    expect(F.get(atom)).toEqual({ foo: 124, bar: "tsers" })
  })

  it("supports state slicing by Ramda lens (van Laarhoven lens)", () => {
    const initial = { foo: 123, bar: "tsers" }
    const atom = F.atom(initial)
    const foo = F.view(atom, R.lensProp("foo") as F.Lens<typeof initial, number>)
    expect(F.get(foo)).toEqual(123)
    F.modify(foo, x => x + 1)
    expect(F.get(foo)).toEqual(124)
    expect(F.get(atom)).toEqual({ foo: 124, bar: "tsers" })
  })

  it("supports state slicing by partial.lenses lens (van Laarhoven lens)", () => {
    const initial = { foo: 123, bar: "tsers" }
    const atom = F.atom(initial)
    const foo = F.view(atom, L.prop("foo") as F.Lens<typeof initial, number>)
    expect(F.get(foo)).toEqual(123)
    F.modify(foo, x => x + 1)
    expect(F.get(foo)).toEqual(124)
    expect(F.get(atom)).toEqual({ foo: 124, bar: "tsers" })
  })

  it("emits the state changes to subscribers", () => {
    const recording = run(record => {
      const atom = F.atom("tsers")
      F.pipe(
        atom,
        F.subscribe(record),
      )
      record(Sync)
      F.modify(atom, s => s.toUpperCase())
      F.set(atom, "lolbal")
    })
    expect(recording).toMatchSnapshot()
  })

  it("emits only real changes to the root state", () => {
    const recording = run(record => {
      const atom = F.atom("tsers")
      F.pipe(
        atom,
        F.subscribe(record),
      )
      record(Sync)
      F.modify(atom, s => s)
      F.set(atom, "tsers")
    })
    expect(recording).toMatchSnapshot()
  })

  it("emits only real changes to the derived states", () => {
    const recording = run(record => {
      const root = F.atom({ num: 123, msg: "tsers" })
      const msg = F.view(root, "msg")
      F.pipe(
        msg,
        F.subscribe(record),
      )
      record(Sync)
      F.modify(msg, s => s)
      F.set(msg, "tsers")
    })
    expect(recording).toMatchSnapshot()
  })

  it("follows transaction semantics when combining derived state", () => {
    const recording = run(record => {
      const root = F.atom({ num: 123, msg: "tsers" })
      const msg = F.view(root, "msg")
      F.pipe(
        F.combineTemplate({ root, derived: msg }),
        F.subscribe(record),
      )
      record(Sync)
      F.modify(msg, s => s + "!")
      F.set(msg, "lolbal")
    })
    expect(recording).toMatchSnapshot()
  })

  it("works even if the state is modified during the transaction", () => {
    const atom = F.atom("tsers")
    const recording = run(record => {
      F.pipe(
        atom,
        F.flatMapLatest(value =>
          value === "tsers"
            ? F.pipe(
                F.once(value),
                F.doAction(x => {
                  F.set(atom, x.toUpperCase())
                }),
              )
            : F.once(value),
        ),
        F.subscribe(record),
      )
    })
    expect(recording).toMatchSnapshot()
  })
})
