import { DefaultScheduler } from "./DefaultScheduler"
import { Scheduler } from "./Scheduler"

export { Scheduler, Task, Timeout, OnTimeout } from "./Scheduler"

const DEFAULT = new DefaultScheduler()
let scheduler: Scheduler = DEFAULT
let isOverride = false

export function currentScheduler(): Scheduler {
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
  if (prev.hasPendingTasks()) {
    throw new Error("Previous scheduler has still tasks pending")
  }
  scheduler = impl
  isOverride = true
  block(impl, () => {
    if (scheduler.hasPendingTasks()) {
      throw new Error("Override scheduler has still tasks pending")
    }
    isOverride = false
    scheduler = prev
  })
}
