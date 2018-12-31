import * as F from "../src/bacon"

describe("Observable.toPromise", () => {
  it("resolves promise from the last value", done => {
    F.sequentially(10, [1, 2, 3])
      .toPromise()
      .then(result => {
        expect(result).toEqual(3)
      })
      .then(done)
  })

  it("rejects the promise if error is emitted before last value", done => {
    F.sequentially(10, [1, new F.Error(new Error("oops")), 2, 3])
      .toPromise()
      .then(result => {
        done.fail("Should be rejected")
      })
      .catch(() => {
        done()
      })
  })
})

describe("Observable.firstToPromise", () => {
  it("resolves promise from the first value", done => {
    F.sequentially(10, [1, 2, 3])
      .firstToPromise()
      .then(result => {
        expect(result).toEqual(1)
      })
      .then(done)
  })

  it("rejects the promise if error is emitted before last value", done => {
    F.sequentially(10, [new F.Error(new Error("oops")), 1, 2, 3])
      .firstToPromise()
      .then(result => {
        done.fail("Should be rejected")
      })
      .catch(() => {
        done()
      })
  })
})
