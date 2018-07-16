import { DefaultScheduler } from "./DefaultScheduler"
import { OnTimeout, Scheduler, Task, Timeout } from "./Scheduler"

export { Scheduler, Task, Timeout, OnTimeout } from "./Scheduler"

let _scheduler: Scheduler = DefaultScheduler.create()
let _isOverride = false

export function getInnerScheduler(): Scheduler {
  return _scheduler.getInner()
}

export function getOuterScheduler(): Scheduler {
  return _scheduler
}

export function withScheduler<S extends Scheduler>(
  impl: S,
  block: (scheduler: S, done: () => void) => void,
): void {
  if (_isOverride) {
    throw new Error("Nested withScheduler not supported")
  }
  const prev = _scheduler
  _scheduler = impl
  _isOverride = true
  block(impl, () => {
    _isOverride = false
    _scheduler = prev
  })
}

// use this wrapper functions instead so that bundlers can optimize
// bundle size more effeciently

export function schedulePropertyActivation(scheduler: Scheduler, task: Task): void {
  scheduler.schedulePropertyActivation(task)
}

export function scheduleStreamActivation(scheduler: Scheduler, task: Task): void {
  scheduler.scheduleEventStreamActivation(task)
}

export function scheduleTimeout(
  scheduler: Scheduler,
  onTimeout: OnTimeout,
  delay: number,
): Timeout {
  return scheduler.scheduleTimeout(onTimeout, delay)
}
