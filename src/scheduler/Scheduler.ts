export interface Task {
  run(): void

  cancel(): void
}

export interface Scheduler {
  schedulePropertyActivation(task: Task): void

  scheduleEventStreamActivation(task: Task): void

  scheduleAbortSubscription(task: Task): void

  scheduleDelayed(task: Task, delay: number): void

  run(): void
}
