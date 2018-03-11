import { DefaultScheduler } from "./DefaultScheduler"
import { Scheduler } from "./Scheduler"

export { Scheduler, Task } from "./Scheduler"

const scheduler = new DefaultScheduler()

export function currentScheduler(): Scheduler {
  return scheduler
}
