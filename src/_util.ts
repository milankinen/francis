export type JSError = Error

export function noop(): void {
  /* no-op */
}

export function identity<T>(x: T): T {
  return x
}

export function disableNoUnusedWarning(a?: any, b?: any, c?: any, d?: any, e?: any) {}
