import { DefaultScheduler } from "./DefaultScheduler"
import { Scheduler } from "./Scheduler"

export { Scheduler, Task, Timeout, OnTimeout } from "./Scheduler"

let scheduler: Scheduler = DefaultScheduler.create()
let isOverride = false

export function getInnerScheduler(): Scheduler {
  return scheduler.getInner()
}

export function getOuterScheduler(): Scheduler {
  return scheduler
}

export function withScheduler<S extends Scheduler>(
  impl: S,
  block: (scheduler: S, done: () => void) => void,
): void {
  if (isOverride) {
    throw new Error("Nested withScheduler not supported")
  }
  const prev = scheduler
  scheduler = impl
  isOverride = true
  block(impl, () => {
    isOverride = false
    scheduler = prev
  })
}
