import { __DEVBUILD__, assert, GENERIC_ERROR_MSG } from "./_assert"
import { isArray, isFunction, isInteger } from "./_util"
import { isEventStream } from "./EventStream"
import { isProperty } from "./Property"

export function checkObservable(x: any): void {
  const ok = isEventStream(x) || isProperty(x)
  assert(ok, __DEVBUILD__ ? (!ok ? `Expected an Observable but got ${x}` : "") : GENERIC_ERROR_MSG)
}

export function checkProperty(x: any): void {
  const ok = isProperty(x)
  assert(ok, __DEVBUILD__ ? (!ok ? `Expected a Property but got ${x}` : "") : GENERIC_ERROR_MSG)
}

export function checkEventStream(x: any): void {
  const ok = isEventStream(x)
  assert(ok, __DEVBUILD__ ? (!ok ? `Expected an EventStream but got ${x}` : "") : GENERIC_ERROR_MSG)
}

export function checkNaturalInt(x: any): void {
  const ok = isInteger(x) && x >= 0
  assert(
    ok,
    __DEVBUILD__ ? (!ok ? `Expected an integer >= 0 but got ${x}` : "") : GENERIC_ERROR_MSG,
  )
}

export function checkPositiveInt(x: any): void {
  const ok = isInteger(x) && x > 0
  assert(
    ok,
    __DEVBUILD__ ? (!ok ? `Expected a positive integer but got ${x}` : "") : GENERIC_ERROR_MSG,
  )
}

export function checkFunction(x: any): void {
  const ok = isFunction(x)
  assert(ok, __DEVBUILD__ ? (!ok ? `Expected a function but got ${x}` : "") : GENERIC_ERROR_MSG)
}

export function checkArray(x: any): void {
  const ok = isArray(x)
  assert(ok, __DEVBUILD__ ? (!ok ? `Expected an array but got ${x}` : "") : GENERIC_ERROR_MSG)
}

export function checkFunctionOrProperty(x: any): void {
  const ok = isFunction(x) || isProperty(x)
  assert(
    ok,
    __DEVBUILD__ ? (!ok ? `Expected a function or Property but got ${x}` : "") : GENERIC_ERROR_MSG,
  )
}
