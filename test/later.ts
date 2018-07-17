import * as F from "../bacon"
import { Sync } from "./_base"

describe("F.later", () => {
  it("delays the given value and ends", done => {
    const rec = [] as any[]
    const t = Date.now()
    F.later(10, "tsers").subscribe(e => {
      rec.push(e)
      if (e.isEnd) {
        expect(rec).toMatchSnapshot()
        expect(Date.now() - t).toBeGreaterThanOrEqual(10)
        done()
      }
    })
    rec.push(Sync)
  })

  it("can be called without value", done => {
    const rec = [] as any[]
    const t = Date.now()
    F.later(10).subscribe(e => {
      rec.push(e)
      if (e.isEnd) {
        expect(rec).toMatchSnapshot()
        expect(Date.now() - t).toBeGreaterThanOrEqual(10)
        done()
      }
    })
  })

  it("requires that delay is given and it's a number", () => {
    expect(() => F.later("tsers" as any)).toThrowError()
    expect(() => (F as any).later()).toThrowError()
  })
})
