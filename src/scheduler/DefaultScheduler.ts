import { __DEVELOPER__, logAndThrow } from "../_assert"
import { OnTimeout, Scheduler, Task, Timeout } from "./Scheduler"

export class DefaultScheduler implements Scheduler {
  public static create(): Scheduler {
    return new DefaultScheduler(null)
  }

  private cursor: number = 0
  private syncTasks: Task[] = []
  private deferredTasks: Task[] = []
  private promise: Promise<any> | null = null

  private constructor(private outer: DefaultScheduler | null) {}

  public getInner(): Scheduler {
    if (__DEVELOPER__) {
      this.cursor === 0 &&
        logAndThrow("**BUG** Scheduler must be running in order to fork inner scheduler")
    }
    return new DefaultScheduler(this)
  }

  public schedulePropertyActivation(task: Task): void {
    if (this.outer !== null) {
      this.outer.schedulePropertyActivation(task)
    } else {
      this.queueSyncTask(task)
    }
  }

  public scheduleEventStreamActivation(task: Task): void {
    if (this.outer !== null) {
      this.outer.schedulePropertyActivation(task)
    } else {
      this.queueMicroTask(task)
    }
  }

  public scheduleTimeout(onTimeout: OnTimeout, delay: number): Timeout {
    return new BasicTimeout(setTimeout(() => onTimeout.due(), delay))
  }

  public run(): void {
    if (this.outer !== null) {
      this.outer.run()
    } else {
      const tasks = this.syncTasks
      while (this.cursor < tasks.length) {
        const task = tasks[this.cursor++]
        task.run()
      }
      this.syncTasks = []
      this.cursor = 0
    }
  }

  private queueSyncTask(task: Task): void {
    this.syncTasks.push(task)
  }

  private queueMicroTask(task: Task): void {
    this.deferredTasks.push(task)
    if (this.promise === null) {
      // TODO: better error handling
      this.promise = Promise.resolve()
        .then(() => this.dequeueMicroTasks())
        .catch(console.error)
    }
  }

  private dequeueMicroTasks(): void {
    this.syncTasks = this.deferredTasks
    this.deferredTasks = []
    this.promise = null
    this.run()
  }
}

class BasicTimeout implements Timeout {
  constructor(private tid: NodeJS.Timer | null) {}

  public cancel(): void {
    if (this.tid !== null) {
      clearTimeout(this.tid)
      this.tid = null
    }
  }
}
