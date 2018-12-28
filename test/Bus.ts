import * as F from "../src/bacon"
import { byLabel, labeled, run, Sync } from "./_base"

describe("F.Bus", () => {
  it("implements EventStream", () => {
    const bus = new F.Bus()
    expect(bus).toBeInstanceOf(F.EventStream)
  })

  it("allows pushing events after subscription", () => {
    const recording = run(record => {
      const bus = new F.Bus<string>()
      bus.map(x => x.toUpperCase()).subscribe(record)
      bus.push("lol")
      bus.error(new Error("Tsers!"))
      bus.push("bal")
      bus.push(new F.End())
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })

  it("does not remember pushed events before subscription", () => {
    const recording = run(record => {
      const bus = new F.Bus<string>()
      bus.push("tsers")
      bus.subscribe(record)
      bus.push("lol")
      bus.push("bal")
      bus.push(new F.End())
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })

  it("does not emit events after end event", () => {
    const recording = run(record => {
      const bus = new F.Bus<string>()
      bus.subscribe(record)
      bus.push(new F.End())
      bus.push("lol")
      bus.error(new Error("Tsers!"))
      bus.push("bal")
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })

  it("emits its end state to late subscribers", () => {
    const recording = run((record, wait) => {
      const bus = new F.Bus<string>()
      bus.subscribe(labeled(record, "first"))
      bus.push(new F.End())
      wait(100, () => bus.subscribe(labeled(record, "second")))
    })
    expect(byLabel(recording)).toMatchSnapshot()
  })

  it("works with looped streams", () => {
    const recording = run(record => {
      const bus = new F.Bus<number>()
      bus
        .doAction(x => x < 10 && bus.push(x * 10))
        .map(x => x * 2)
        .subscribe(record)
      bus.push(1)
      bus.push(2)
      bus.push(3)
    })
    expect(recording).toMatchSnapshot()
  })

  it("works with higher order looped streams", () => {
    const recording = run(record => {
      const bus = new F.Bus<number>()
      bus
        .flatMapLatest(u => F.fromArray([u, u]).doAction(x => x < 10 && bus.push(x * 10)))
        .map(x => x * 2)
        .subscribe(record)
      bus.push(1)
      bus.push(2)
      bus.push(3)
    })
    expect(recording).toMatchSnapshot()
  })

  it("works inside flatMap*", () => {
    const recording = run(record => {
      F.fromArray([1, 2, 3])
        .toProperty(0)
        .flatMapLatest(u => {
          const bus = new F.Bus<number>()
          F.once(u).onValue(x => bus.push(x * 2))
          return bus
        })
        .subscribe(record)
      record(Sync)
    })
    expect(recording).toMatchSnapshot()
  })

  it("disposes plugged inputs on bus.end()", () => {
    const recording = run((record, wait) => {
      const bus = new F.Bus<number>()
      bus.plug(F.fromArray([1, 2]))
      bus.subscribe(record)
      bus.plug(F.fromArray([3, 4]).delay(5))
      record(Sync)
      wait(10, () => {
        bus.push(10)
        bus.end()
      })
    })
    expect(recording).toMatchSnapshot()
  })

  it("does not activate plugged inputs if bus is not activated", () => {
    const recording = run(record => {
      const bus = new F.Bus<number>()
      bus.plug(F.fromBinder(_ => record("ACTIVATE")))
    })
    expect(recording).toEqual([])
  })

  it("returns an unplug function for plugged inputs", () => {
    const recording = run(record => {
      const bus = new F.Bus<string>()
      const unplug = bus.plug(F.later(100, "tsers"))
      bus.subscribe(record)
      unplug()
    })
    expect(recording).toEqual([])
  })
})
