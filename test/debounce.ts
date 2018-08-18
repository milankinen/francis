import * as F from "../src/bacon"
import { run, Sync } from "./_base"

describe("EventStream.debounce", () => {
  it("results in EventStream", () => {
    expect(F.once(1).debounce(1)).toBeInstanceOf(F.EventStream)
  })

  it("waits for a quiet period before outputing anything", () => {
    const recording = run((record, wait, now) => {
      const t = now()
      F.fromBinder<number>(sink => {
        wait(2, () => sink(1))
        wait(4, () => sink(2))
        wait(5, () => sink(new F.Error("tsers" as any)))
        wait(8, () => sink(3))
        wait(17, () => sink(4))
        wait(20, () => sink(5))
        wait(30, () => sink(new F.End()))
      })
        .debounce(5)
        .subscribe(event => record({ tick: now() - t, event }))
    })
    expect(recording).toMatchSnapshot()
  })
})

describe("Property.debounce", () => {
  it("results in Property", () => {
    expect(F.constant(1).debounce(1)).toBeInstanceOf(F.Property)
  })
  it("emits initial event immediately and after that waits for a quiet period before outputing anything", () => {
    const recording = run((record, wait, now) => {
      const t = now()
      F.fromBinder<number>(sink => {
        wait(2, () => sink(1))
        wait(4, () => sink(2))
        wait(5, () => sink(new F.Error("tsers" as any)))
        wait(8, () => sink(3))
        wait(17, () => sink(4))
        wait(20, () => sink(5))
        wait(30, () => sink(new F.End()))
      })
        .toProperty(0)
        .debounce(5)
        .subscribe(event => record({ tick: now() - t, event }))
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })
})

describe("EventStream.debounceImmediate", () => {
  it("results in EventStream", () => {
    expect(F.once(1).debounceImmediate(1)).toBeInstanceOf(F.EventStream)
  })

  it("outputs first event immediately, then ignores events for given amount of milliseconds", () => {
    const recording = run((record, wait, now) => {
      const t = now()
      F.fromBinder<number>(sink => {
        wait(2, () => sink(1))
        wait(4, () => sink(2))
        wait(5, () => sink(new F.Error("tsers" as any)))
        wait(8, () => sink(3))
        wait(17, () => sink(4))
        wait(20, () => sink(5))
        wait(30, () => sink(new F.End()))
      })
        .debounceImmediate(5)
        .subscribe(event => record({ tick: now() - t, event }))
    })
    expect(recording).toMatchSnapshot()
  })
})

describe("Property.debounceImmediate", () => {
  it("results in Property", () => {
    expect(F.constant(1).debounceImmediate(1)).toBeInstanceOf(F.Property)
  })
  it("outputs initial and first event immediately, then ignores events for given amount of milliseconds", () => {
    const recording = run((record, wait, now) => {
      const t = now()
      F.fromBinder<number>(sink => {
        wait(2, () => sink(1))
        wait(4, () => sink(2))
        wait(5, () => sink(new F.Error("tsers" as any)))
        wait(8, () => sink(3))
        wait(17, () => sink(4))
        wait(20, () => sink(5))
        wait(30, () => sink(new F.End()))
      })
        .toProperty(0)
        .debounceImmediate(5)
        .subscribe(event => record({ tick: now() - t, event }))
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })
})
