import { DefaultScheduler } from "./DefaultScheduler"
import { Scheduler } from "./Scheduler"

export { Scheduler, Task, Timeout, OnTimeout } from "./Scheduler"

const scheduler = new DefaultScheduler()

export function currentScheduler(): Scheduler {
  return scheduler
}
