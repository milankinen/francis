import { SchedulingContext } from "./SchedulingContext"

export { SchedulingContext } from "./SchedulingContext"

export interface Task {
  run(): void
}

export interface Timeout {
  cancel(): void
}

export interface OnTimeout {
  due(): void
}

const context: SchedulingContext = new SchedulingContext()

// use these wrapper functions instead so that bundlers can optimize
// bundle size more effeciently

export function stepIn(): void {
  context.stepIn()
}

export function stepOut(): void {
  context.stepOut()
}

export function handleActivations(): void {
  context.handleActivations()
}

export function scheduleActivationTask(task: Task): void {
  context.scheduleActivation(task)
}

export function scheduleTimeout(onTimeout: OnTimeout, delay: number): Timeout {
  return context.scheduleTimeout(onTimeout, delay)
}
