import { __DEVBUILD__, assert, GENERIC_ERROR_MSG } from "../_assert"
import { find, isFunction } from "../_util"
import { EventStream } from "../EventStream"
import { fromBinder } from "./fromBinder"

const pairs = [
  ["addEventListener", "removeEventListener"],
  ["addListener", "removeListener"],
  ["on", "off"],
  ["bind", "unbind"],
]

export interface FromEventOp {
  <T>(target: EventTarget, event: string, ...args: any[]): EventStream<T>
  (target: EventTarget): <T>(event: string, ...args: any[]) => EventStream<T>
}

export const fromEvent: FromEventOp = _fromEventCurried as any

// tslint:disable:ban-types

function _fromEventCurried(target: EventTarget, event: string, ...args: any[]): any {
  switch (arguments.length) {
    case 0:
    case 1:
      // tslint:disable-next-line:no-shadowed-variable
      return (event: string, ...args: any[]): any => _fromEvent(target, event, args)
    default:
      return _fromEvent(target, event, args)
  }
}

function _fromEvent<T>(target: EventTarget, event: string, args: any[]): EventStream<T> {
  assert(target !== undefined, __DEVBUILD__ ? "Event target must be defined" : GENERIC_ERROR_MSG)
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
