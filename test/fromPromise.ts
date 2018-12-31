import * as F from "../src/bacon"

describe("F.fromPromise", () => {
  it("emits promise's value and ends", done => {
    const promise = new Promise<string>(resolve => setTimeout(() => resolve("tsers"), 100))
    const rec: any[] = []
    F.fromPromise(promise).subscribe(e => {
      rec.push(e)
      if (e.isEnd) {
        expect(rec).toMatchSnapshot()
        done()
      }
    })
  })

  it("emits error if promise gets rejected", done => {
    const promise = new Promise<string>(resolve => setTimeout(() => resolve("tsers"), 100)).then(
      () => {
        throw new Error("oops")
      },
    )
    const rec: any[] = []
    F.fromPromise(promise).subscribe(e => {
      rec.push(e)
      if (e.isEnd) {
        expect(rec).toMatchSnapshot()
        done()
      }
    })
  })
})
