export type JSError = Error

export const MAX_SAFE_INTEGER = 9007199254740991

export function noop(): void {
  /* no-op */
}

export function identity<T>(x: T): T {
  return x
}

export function disableNoUnusedWarning(a?: any, b?: any, c?: any, d?: any, e?: any) {}

// tslint:disable-next-line:ban-types
export function isFunction(x: any): x is Function {
  return !!(x && x.constructor && x.call && x.apply)
}

// tslint:disable-next-line:array-type
export function isArray(x: any): x is Array<any> {
  return !!x && x.constructor === Array
}

// tslint:disable-next-line:ban-types
export function isObject(x: any): x is Object {
  if (!!x && typeof x === "object") {
    const proto = Object.getPrototypeOf(x)
    return proto === Object.prototype || proto === null
  } else {
    return false
  }
}

export function slice<T>(arr: T[]): T[] {
  return arr.slice()
}

export function every<T>(pred: (x: T) => boolean, xs: T[]): boolean {
  let n = xs.length
  while (n--) {
    if (!pred(xs[n])) return false
  }
  return true
}

export function find<T>(pred: (x: T) => boolean, xs: T[]): T | undefined {
  for (let i = 0, n = xs.length; i < n; i++) {
    if (pred(xs[i])) return xs[i]
  }
  return undefined
}

export function constantly<T>(x: T): () => T {
  return () => x
}
