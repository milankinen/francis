export const __DEVBUILD__: boolean = process.env.NODE_ENV !== "production"

export const __DEVELOPER__: boolean =
  process.env.NODE_ENV !== "production" && (global as any).__FRANCIS_DEV__ === 1

export const GENERIC_ERROR_MSG =
  "Assertion failed, use development build to get better error message"

export function assert(invariant: boolean, message: string): void {
  if (!invariant) {
    throw new Error(message)
  }
}

export function assertd(invariant: boolean, message: () => string): void {
  if (!invariant) {
    throw new Error(message())
  }
}

export function logAndThrow(msg: string) {
  const err = new Error(msg)
  // tslint:disable-next-line:no-console
  console.error(err)
  throw err
}
