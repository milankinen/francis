export const __DEVBUILD__: boolean = process.env.NODE_ENV !== "production"

export const __DEVELOPER__: boolean = process.env.FRANCIS_DEVELOPER === "1"

export function assert(invariant: boolean, message: string): void {
  if (!invariant) {
    throw new Error(message)
  }
}

export function logAndThrow(msg: string) {
  const err = new Error(msg)
  // tslint:disable-next-line:no-console
  console.error(err)
  throw err
}
