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

/**
 * Creates an EventStream from events on `EventTarget` or `EventEmitter` object,
 * or an object that supports event listeners using `on`/`off` methods.
 *
 * @param target - EventTarget object whose events will be listened
 * @param event - Name of the listened event
 * @param args - Extra args passed to the `addListener` / `on` function
 *
 * @example
 *
 * const bubbleClicks = F.fromEvent(document.querySelector("#my-button"), "click")
 * const captureClicks = F.fromEvent(document.querySelector("#my-button"), "click", true)
 *
 * @public
 */
export const fromEvent: CurriedFromEvent = _fromEventCurried as any
interface CurriedFromEvent {
  <ValueType>(target: EventTarget, event: string, ...args: any[]): EventStream<ValueType>
  (target: EventTarget): <ValueType>(event: string, ...args: any[]) => EventStream<ValueType>
}

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
