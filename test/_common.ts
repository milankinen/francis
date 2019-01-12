import * as F from "../src/index"
import { run } from "./_base"

export const testInitialValueShouldBeDerivableFromSource = (
  op: (source: F.Observable<number>) => F.Observable<number>,
): void => {
  run(() => {
    const source = F.bus<number>()
    const a = [] as any[]
    const b = [] as any[]
    const propA = F.toPropertyWith(0, source)
    const propB = op(propA)
    expect(propB).toBeInstanceOf(F.Property)

    // case 1 - both properties should get the initial value of A
    let unsubA = F.onValue(x => a.push(x), propA)
    let unsubB = F.onValue(x => b.push(x), propB)

    // case 2 - both properties should get the new value
    F.push(source, 1)
    expect(a).toEqual([0, 1])
    expect(b).toEqual([0, 1])
    unsubB()

    // case 3 - only A should get the new value because B is unsubscribed from A
    F.push(source, 2)
    expect(a).toEqual([0, 1, 2])
    expect(b).toEqual([0, 1])

    // case 4 - B should derive its new initial value from A
    unsubB = F.onValue(x => b.push(x), propB)
    expect(b).toEqual([0, 1, 2])

    // cleanup
    unsubA()
    unsubB()
    unsubB = unsubA = void 0 as any
  })
}
