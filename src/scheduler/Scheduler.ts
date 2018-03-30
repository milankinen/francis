export interface Task {
  run(): void
}

export interface Timeout {
  cancel(): void
}

export interface OnTimeout {
  due(): void
}

export interface Scheduler {
  forkOuter(): Scheduler

  forkInner(): Scheduler

  schedulePropertyActivation(task: Task): void

  scheduleEventStreamActivation(task: Task): void

  scheduleTimeout(onTimeout: OnTimeout, delay: number): Timeout

  run(): void
}
