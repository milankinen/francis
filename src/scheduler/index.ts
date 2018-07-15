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

let _ctx: SchedulingContext = new SchedulingContext()
let _isOverride = false

// use these wrapper functions instead so that bundlers can optimize
// bundle size more effeciently

export function stepIn(): void {
  _ctx.stepIn()
}

export function stepOut(): void {
  _ctx.stepOut()
}

export function handleActivations(): void {
  _ctx.handleActivations()
}

export function scheduleActivationTask(task: Task): void {
  _ctx.scheduleActivation(task)
}

export function scheduleTimeout(onTimeout: OnTimeout, delay: number): Timeout {
  return _ctx.scheduleTimeout(onTimeout, delay)
}

// Mainly intended for testing, do not try to override
// default context in real use case
export function withContext<S extends SchedulingContext>(
  impl: S,
  block: (scheduler: S, done: () => void) => void,
): void {
  if (_isOverride) {
    throw new Error("Nested scheduling context override not supported")
  }
  const prev = _ctx
  _ctx = impl
  _isOverride = true
  block(impl, () => {
    _isOverride = false
    _ctx = prev
  })
}
