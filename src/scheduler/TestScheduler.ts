import { logAndThrow } from "../_assert"
import { OnTimeout, Scheduler, Task, Timeout } from "./scheduler"

export type EndListener = (error?: Error) => void

export class TestScheduler implements Scheduler {
  public static create(): TestScheduler {
    return new TestScheduler(null)
  }

  private runStack: number = 0
  private unscheduled: boolean = false
  private cursor: number = 0
  private currentTick: number = 0
  private syncTasks: Task[] = []
  private asyncSlots: TimeSlot[] = []
  private promise: Promise<any> | null = null
  private listener: EndListener | null = null

  private constructor(private outer: TestScheduler | null) {}

  public getInner(): Scheduler {
    this.cursor === 0 && logAndThrow("Can't fork inner scheduler - scheduler is not running")
    return new TestScheduler(this)
  }

  public consume(listener: EndListener): void {
    this.listener = listener
    this.run()
  }

  public unscheduleAll(): void {
    this.unscheduled = true
    this.syncTasks = []
    this.asyncSlots = []
    this.promise = null
    this.currentTick = 0
  }

  public schedulePropertyActivation(task: Task): void {
    if (this.outer !== null) {
      this.outer.schedulePropertyActivation(task)
    } else {
      this.scheduleSync(task)
    }
  }

  public scheduleEventStreamActivation(task: Task): void {
    if (this.outer !== null) {
      this.outer.schedulePropertyActivation(task)
    } else {
      this.scheduleMicroTask(task)
    }
  }

  public scheduleTimeout(onTimeout: OnTimeout, delay: number): Timeout {
    if (this.outer !== null) {
      return this.outer.scheduleTimeout(onTimeout, delay)
    } else {
      return this.scheduleTimeoutTask(new TimeoutTask(onTimeout), delay)
    }
  }

  public run(): void {
    if (this.outer !== null) {
      this.outer.run()
    } else {
      this.runStack++
      while (this.cursor < this.syncTasks.length) {
        const task = this.syncTasks[this.cursor++]
        task.run()
      }
      this.syncTasks = []
      this.cursor = 0
      this.runStack--
      if (this.runStack === 0 && this.asyncSlots.length === 0) {
        this.notifyEnded()
      }
    }
  }

  private scheduleSync(task: Task): void {
    this.syncTasks.push(task)
  }

  private scheduleMicroTask(task: Task): void {
    this.queueAsync(task, 0)
  }

  private scheduleTimeoutTask(task: Task, delay: number): Timeout {
    // delay = 0 is reserved for micro tasks
    this.queueAsync(task, delay + 1)
    return new TestTimeout(() => {
      this.cancelAsyncTask(task)
    })
  }

  private queueAsync(task: Task, delay: number): void {
    const slots = this.asyncSlots
    const tick = this.currentTick + delay
    let i = 0
    for (; i < slots.length; i++) {
      if (slots[i].tick > tick) {
        break
      }
    }
    slots.splice(i, 0, { task, tick })
    this.ensureNextTickConsume()
  }

  private cancelAsyncTask(task: Task): void {
    const slots = this.asyncSlots
    const idx = slots.findIndex(s => s.task === task)
    if (idx !== -1) {
      slots.splice(idx, 1)
      this.ensureNextTickConsume()
    }
  }

  private ensureNextTickConsume(): void {
    if (this.asyncSlots.length > 0 && this.promise === null) {
      this.promise = Promise.resolve()
        .then(() => !this.unscheduled && this.consumeNextTick())
        .catch(err => {
          this.unscheduleAll()
          this.notifyEnded(err)
        })
    }
  }

  private consumeNextTick(): void {
    this.promise = null
    const slots = this.asyncSlots

    if (slots.length === 0) {
      this.notifyEnded()
      return
    }
    const tick = (this.currentTick = slots[0].tick)
    const tasks = []
    let i = 0
    while (i < slots.length && slots[i].tick === tick) {
      tasks.push(slots[i++].task)
    }
    slots.splice(0, i)
    this.syncTasks = tasks
    this.run()
    this.ensureNextTickConsume()
  }

  private notifyEnded(error?: Error): void {
    const li = this.listener
    if (li !== null) {
      Promise.resolve().then(() => li(error))
    }
  }
}

class TestTimeout implements Timeout {
  constructor(private onCancel: (() => void) | null) {}
  public cancel(): void {
    if (this.onCancel !== null) {
      const c = this.onCancel
      this.onCancel = null
      c()
    }
  }
}

class TimeoutTask implements Task {
  constructor(private onTimeout: OnTimeout) {}
  public run(): void {
    this.onTimeout.due()
  }
}

interface TimeSlot {
  task: Task
  tick: number
}
