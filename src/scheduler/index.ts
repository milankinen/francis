import { setTx } from "../_core"
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
setTx(context.getRootTx())

// use these wrapper functions instead so that bundlers can optimize
// bundle size more effeciently

export function stepIn(): void {
  const tx = context.stepIn()
  setTx(tx)
}

export function stepOut(): void {
  const tx = context.stepOut()
  setTx(tx)
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
