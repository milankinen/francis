import { find, isFunction } from "../_util"
import { EventStream } from "../EventStream"
import { fromBinder } from "./fromBinder"

const pairs = [
  ["addEventListener", "removeEventListener"],
  ["addListener", "removeListener"],
  ["on", "off"],
  ["bind", "unbind"],
]

// tslint:disable:ban-types
export function fromEvent<T>(target: EventTarget, event: string, ...args: any[]): EventStream<T> {
  const anyTarget = target as any
  const [bm, um] =
    find(([b, u]) => isFunction(anyTarget[b]) && isFunction(anyTarget[u]), pairs) ||
    find(([b]) => isFunction(anyTarget[b]), pairs) ||
    noMethods(target)
  const bind = anyTarget[bm] as Function
  const unbind = (anyTarget[um] || (() => {})) as Function

  return fromBinder(sink => {
    bind.apply(target, [event, sink, ...args])
    return () => {
      unbind.apply(target, [event, sink, ...args])
    }
  })
}

function noMethods(target: EventTarget): string[] {
  throw new Error("No suitable event methods in " + target)
}
