import { __DEVBUILD__ } from "./_assert"
import { isObservable } from "./_obs"
import { isFunction, isObject } from "./_util"
import { Observable } from "./Observable"
import { constant } from "./sources/constant"

export function toObservable<T, O extends Observable<T>>(maybeObs: O | T): O {
  if (isObservable(maybeObs)) {
    return maybeObs
  } else {
    return constant(maybeObs) as any
  }
}

export function toFunction<T>(maybeFn: T, args: any[]): T {
  if (isFunction(maybeFn)) {
    return maybeFn
  } else if (typeof maybeFn === "string") {
    if (maybeFn.length > 1 && maybeFn.substr(0, 1) === ".") {
      return propertyOrMethodCall(maybeFn.substr(1), args)
    } else {
      return constantly(maybeFn)
    }
  } else if (isObject(maybeFn) && args.length > 0) {
    return papplyMethodCall(maybeFn, args[0], args.slice(1))
  } else {
    return constantly(maybeFn)
  }
}

function constantly(x: any): any {
  return (_: any) => x
}

function propertyOrMethodCall(pname: string, args: any[]): any {
  const path = pname.split(".")
  if (path.length > 1) {
    return nestedFieldExtract(path)
  } else {
    switch (args.length) {
      case 0:
        return (x: any) => safeCall0(x, pname)
      case 1:
        return (x: any) => safeCall1(x, pname, args[0])
      case 2:
        return (x: any) => safeCall2(x, pname, args[0], args[2])
      default:
        return (x: any) => safeCallN(x, pname, args)
    }
  }
}

function papplyMethodCall(obj: any, fname: string, args: any[]): any {
  const method = obj[fname]
  if (!method) {
    if (__DEVBUILD__) {
      throw new Error("Could not find method '" + fname + "' from object: " + obj)
    }
  }
  return (x: any) => method.call(obj, x, ...args)
}

function nestedFieldExtract(path: string[]): any {
  return (x: any) => path.reduce((o: any, p: string) => o && o[p], x)
}

function safeCall0(x: any, prop: string): any {
  const p = x ? x[prop] : undefined
  return isFunction(p) ? p.call(x) : p
}

function safeCall1(x: any, prop: string, a1: any): any {
  const p = x ? x[prop] : undefined
  return isFunction(p) ? p.call(x, a1) : p
}

function safeCall2(x: any, prop: string, a1: any, a2: any): any {
  const p = x ? x[prop] : undefined
  return isFunction(p) ? p.call(x, a1, a2) : p
}

function safeCallN(x: any, prop: string, args: any[]): any {
  const p = x ? x[prop] : undefined
  return isFunction(p) ? p.apply(x, args) : p
}
