import { __DEVBUILD__, assert } from "./_assert"
import { isObservable } from "./_obs"
import { isFunction, isObject } from "./_util"
import { Observable } from "./Observable"
import { isProperty } from "./Property"
import { constant } from "./sources/constant"

export function toObservable<T, O extends Observable<T>>(maybeObs: O | T): O {
  if (isObservable(maybeObs)) {
    return maybeObs
  } else {
    return constant(maybeObs) as any
  }
}

// tslint:disable-next-line:ban-types
export function toFunction<T>(maybeFn: T, extraArgs: any[]): T {
  if (isFunction(maybeFn)) {
    if (extraArgs.length === 0) {
      return maybeFn
    } else {
      return ((...args: any[]) => maybeFn(...extraArgs, ...args)) as any
    }
  } else if (typeof maybeFn === "string") {
    const s = (maybeFn as any) as string
    if (s.length > 1 && s.substr(0, 1) === ".") {
      return propertyOrMethodCall(s.substr(1), extraArgs)
    } else {
      return constantly(s)
    }
  } else if (isObject(maybeFn) && extraArgs.length > 0) {
    if (__DEVBUILD__) {
      assert(typeof extraArgs[0] === "string", "Object function construct expects a function name")
    }
    return papplyMethodCall(maybeFn, extraArgs[0], extraArgs.slice(1))
  } else {
    return constantly(maybeFn)
  }
}

export function toFunctionsPropAsIs<T>(propertyOrMaybeFn: T, extraArgs: any[]): T {
  return isProperty(propertyOrMaybeFn)
    ? propertyOrMaybeFn
    : toFunction(propertyOrMaybeFn, extraArgs)
}

function constantly(x: any): any {
  return (_: any) => x
}

function propertyOrMethodCall(pname: string, args: any[]): any {
  const path = pname.split(".")
  if (path.length > 1) {
    return nestedFieldExtract(path)
  } else {
    return pappliedGetOrCall(pname, args)
  }
}

function papplyMethodCall(obj: any, fname: string, extraArgs: any[]): any {
  const method = obj[fname]
  if (!isFunction(method)) {
    if (__DEVBUILD__) {
      throw new Error("Could not find method '" + fname + "' from object: " + obj)
    }
  }
  return (...args: any[]) => method.apply(obj, [...extraArgs, ...args])
}

function nestedFieldExtract(path: string[]): any {
  return (x: any) => path.reduce((o: any, p: string) => o && o[p], x)
}

function pappliedGetOrCall(pname: string, extraArgs: any[]) {
  if (extraArgs.length === 0) {
    return (x: any, ...args: any[]) => {
      const p = x ? x[pname] : undefined
      return isFunction(p) ? p.apply(x, args) : p
    }
  } else {
    return (x: any, ...args: any[]) => {
      const p = x ? x[pname] : undefined
      return isFunction(p) ? p.apply(x, [...extraArgs, ...args]) : p
    }
  }
}
