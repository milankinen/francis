import { DefaultScheduler } from "./DefaultScheduler"
import { Scheduler } from "./Scheduler"

export { Scheduler, Task, Timeout, OnTimeout } from "./Scheduler"

let root: Scheduler = DefaultScheduler.create()
let isOverride = false

export function createInnerScheduler(): Scheduler {
  return root.forkInner()
}

export function createOuterScheduler(): Scheduler {
  return root.forkOuter()
}

export function withScheduler<S extends Scheduler>(
  impl: S,
  block: (scheduler: S, done: () => void) => void,
): void {
  if (isOverride) {
    throw new Error("Nested withScheduler not supported")
  }
  const prev = root
  root = impl
  isOverride = true
  block(impl, () => {
    isOverride = false
    root = prev
  })
}
