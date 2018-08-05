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

export function pipe<A, B>(a: A, a2b: (a: A) => B): B
export function pipe<A, B, C>(a: A, a2b: (a: A) => B, b2c: (b: B) => C): C
export function pipe<A, B, C, D>(a: A, a2b: (a: A) => B, b2c: (b: B) => C, c2d: (c: C) => D): D
export function pipe<A, B, C, D, E>(
  a: A,
  a2b: (a: A) => B,
  b2c: (b: B) => C,
  c2d: (c: C) => D,
  d2e: (d: D) => E,
): E
export function pipe<A, B, C, D, E, F>(
  a: A,
  a2b: (a: A) => B,
  b2c: (b: B) => C,
  c2d: (c: C) => D,
  d2e: (d: D) => E,
  e2f: (e: E) => F,
): F
export function pipe<A, B, C, D, E, F, G>(
  a: A,
  a2b: (a: A) => B,
  b2c: (b: B) => C,
  c2d: (c: C) => D,
  d2e: (d: D) => E,
  e2f: (e: E) => F,
  f2g: (f: F) => G,
): G
export function pipe<A, B, C, D, E, F, G, H>(
  a: A,
  a2b: (a: A) => B,
  b2c: (b: B) => C,
  c2d: (c: C) => D,
  d2e: (d: D) => E,
  e2f: (e: E) => F,
  f2g: (f: F) => G,
  g2h: (g: G) => H,
): H
export function pipe<A, B, C, D, E, F, G, H, I>(
  a: A,
  a2b: (a: A) => B,
  b2c: (b: B) => C,
  c2d: (c: C) => D,
  d2e: (d: D) => E,
  e2f: (e: E) => F,
  f2g: (f: F) => G,
  g2h: (g: G) => H,
  h2i: (h: H) => I,
): I
export function pipe<A, B, C, D, E, F, G, H, I, J>(
  a: A,
  a2b: (a: A) => B,
  b2c: (b: B) => C,
  c2d: (c: C) => D,
  d2e: (d: D) => E,
  e2f: (e: E) => F,
  f2g: (f: F) => G,
  g2h: (g: G) => H,
  h2i: (h: H) => I,
  i2j: (i: I) => J,
): J
export function pipe<A, B, C, D, E, F, G, H, I, J, K>(
  a: A,
  a2b: (a: A) => B,
  b2c: (b: B) => C,
  c2d: (c: C) => D,
  d2e: (d: D) => E,
  e2f: (e: E) => F,
  f2g: (f: F) => G,
  g2h: (g: G) => H,
  h2i: (h: H) => I,
  i2j: (i: I) => J,
  j2k: (j: J) => K,
): K
export function pipe(x: any, ...fns: any[]): any {
  for (let i = 0, n = fns.length; i < n; i++) {
    x = fns[i](x)
  }
  return x
}

interface CF2<T1, T2, R> {
  (t1: T1): (t2: T2) => R
  (t1: T1, t2: T2): R
}

interface CF3<T1, T2, T3, R> {
  (t1: T1): CF2<T2, T3, R>
  (t1: T1, t2: T2): (t3: T3) => R
  (t1: T1, t2: T2, t3: T3): R
}

// tslint:disable:no-shadowed-variable

export function curry2(f: (t1: any, t2: any) => any): CF2<any, any, any> {
  function c2(t1: any, t2: any): any {
    switch (arguments.length) {
      case 0:
      case 1:
        return (t2: any): any => {
          return f(t1, t2)
        }
      default:
        return f(t1, t2)
    }
  }
  return c2 as any
}

export function curry3(f: (t1: any, t2: any, t3: any) => any): CF3<any, any, any, any> {
  function c3(t1: any, t2: any, t3: any): any {
    switch (arguments.length) {
      case 0:
      case 1:
        return curry2(
          (t2: any, t3: any): any => {
            return f(t1, t2, t3)
          },
        )
      case 2:
        return (t3: any): any => {
          return f(t1, t2, t3)
        }
      default:
        return f(t1, t2, t3)
    }
  }
  return c3 as any
}
