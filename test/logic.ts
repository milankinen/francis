import * as F from "../src/bacon"
import { run } from "./_base"

describe("Property.and", () => {
  it("results in Property", () => {
    expect(F.constant(1).and(F.constant(2))).toBeInstanceOf(F.Property)
  })

  it("returns first falsy value or latest if both are truthy", () => {
    const recording = run(record => {
      const test = (a: boolean, b: boolean): void => {
        F.constant(a)
          .and(F.constant(b))
          .onValue(x => record([`${a} and ${b} => ${x}`]))
      }
      test(true, true)
      test(true, false)
      test(false, true)
      test(false, false)
    })
    expect(recording).toMatchSnapshot()
  })
})

describe("Property.or", () => {
  it("results in Property", () => {
    expect(F.constant(1).or(F.constant(2))).toBeInstanceOf(F.Property)
  })

  it("returns first truthy value or latest if both are falsy", () => {
    const recording = run(record => {
      const test = (a: boolean, b: boolean): void => {
        F.constant(a)
          .or(F.constant(b))
          .onValue(x => record([`${a} and ${b} => ${x}`]))
      }
      test(true, true)
      test(true, false)
      test(false, true)
      test(false, false)
    })
    expect(recording).toMatchSnapshot()
  })
})

describe("Property.not", () => {
  it("results in Property", () => {
    expect(F.constant(1).or(F.constant(2))).toBeInstanceOf(F.Property)
  })

  it("returns boolean negating the value of property", () => {
    const recording = run(record => {
      const test = (x: any): void => {
        F.constant(x)
          .not()
          .onValue(b => record([`NOT ${JSON.stringify(x)} => ${b}`]))
      }
      test("")
      test(true)
      test("tsers")
      test(0)
      test(123)
      test({})
    })
    expect(recording).toMatchSnapshot()
  })
})
