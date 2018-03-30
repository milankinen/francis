import { MAX_ORDER, MAX_WEIGHT, priorityOf } from "../../src/_priority"

describe("Priority construction", () => {
  it("treats smaller weight higher priority than bigger weight", () => {
    expect(priorityOf(0, 1)).toBeLessThan(priorityOf(0, 10))
    expect(priorityOf(0, 1)).toBeLessThan(priorityOf(0, MAX_WEIGHT))
  })

  it("treats lower order higher priority than higher order", () => {
    expect(priorityOf(1, 1)).toBeLessThan(priorityOf(0, 1))
    expect(priorityOf(1, 1)).toBeLessThan(priorityOf(0, MAX_WEIGHT))
    expect(priorityOf(MAX_ORDER, 1)).toBeLessThan(priorityOf(0, MAX_WEIGHT))
    expect(priorityOf(MAX_ORDER, MAX_WEIGHT)).toBeLessThan(priorityOf(0, MAX_WEIGHT))
  })
})
