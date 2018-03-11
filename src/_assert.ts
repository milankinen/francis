export const __DEVBUILD__: boolean = process.env.NODE_ENV !== "production"

export const __DEVELOPER__: boolean = false

export function assert(condition: () => boolean, message?: string): void {
  if (!condition()) {
    throw new Error(message || condition.toString())
  }
}
