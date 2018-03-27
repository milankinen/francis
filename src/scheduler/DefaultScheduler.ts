import { OnTimeout, Scheduler, Task, Timeout } from "./Scheduler"

export class DefaultScheduler implements Scheduler {
  private running: boolean = false
  private syncTasks: Task[] = []
  private deferredTasks: Task[] = []
  private promise: Promise<any> | null = null

  public newInstance(): Scheduler {
    return new DefaultScheduler()
  }

  public hasPendingTasks(): boolean {
    return this.syncTasks.length > 0 || this.deferredTasks.length > 0
  }

  public schedulePropertyActivation(task: Task): void {
    this.queueSyncTask(task)
  }

  public scheduleEventStreamActivation(task: Task): void {
    this.queueMicroTask(task)
  }

  public scheduleTimeout(onTimeout: OnTimeout, delay: number): Timeout {
    return new BasicTimeout(setTimeout(() => onTimeout.due(), delay))
  }

  public run(): void {
    if (!this.running) {
      this.running = true
      const tasks = this.syncTasks
      for (let i = 0; i < tasks.length; i++) {
        tasks[i].run()
      }
      this.syncTasks = []
      this.running = false
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
