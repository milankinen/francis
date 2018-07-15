import { OnTimeout, Task, Timeout } from "./index"
import { SchedulingContext } from "./SchedulingContext"

export type EndListener = (error?: Error) => void

export class TestSchedulingContext extends SchedulingContext {
  private end: EndListener
  private queue: TimeSlot[] = []
  private next: NodeJS.Timer | null = null
  private tick: number = 0

  constructor() {
    super()
    this.end = () => {}
  }

  public runTest(end: EndListener) {
    this.end = end
    this.scheduleNextOrEnd()
  }

  public abort(): void {
    super.abort()
    this.cleanup()
  }

  public scheduleTimeout(onTimeout: OnTimeout, delay: number): Timeout {
    const timeout = this.insertTimeout(onTimeout, delay)
    this.scheduleNextOrEnd()
    return timeout
  }

  public onActivationsEmpty(): void {
    this.scheduleNextOrEnd()
  }

  private insertTimeout(onTimeout: OnTimeout, delay: number): Timeout {
    const { queue } = this
    const tick = this.tick + delay
    const timeout = this.createTimeout(new TimeoutTask(onTimeout))
    for (let i = 0; i < queue.length; i++) {
      if (queue[i].tick > tick) {
        queue.splice(i, 0, { tick, timeout })
        return timeout
      }
    }
    queue.push({ tick, timeout })
    return timeout
  }

  private createTimeout(task: Task): TestTimeout {
    return new TestTimeout(task, to => {
      const idx = this.queue.findIndex(slot => slot.timeout === to)
      if (idx !== -1) {
        this.queue.splice(idx, 0)
      }
    })
  }

  private runNextTimeouts(): void {
    const { queue } = this
    const tasks: Task[] = []
    if (queue.length > 0) {
      const tick = (this.tick = queue[0].tick)
      while (queue.length > 0 && queue[0].tick === tick) {
        tasks.push((queue.shift() as TimeSlot).timeout.task)
      }
    }
    this.runTasks(tasks)
    this.scheduleNextOrEnd()
  }

  private runTasks(tasks: Task[]): void {
    for (let i = 0; i < tasks.length; i++) {
      tasks[i].run()
    }
  }

  private scheduleNextOrEnd(): void {
    if (this.queue.length > 0) {
      if (this.next === null) {
        this.next = setTimeout(() => {
          this.next = null
          this.runNextTimeouts()
        }, 0)
      }
    } else if (!this.hasActivations()) {
      this.cleanup()
      this.end()
    }
  }

  private cleanup(): void {
    this.queue = []
    if (this.next !== null) {
      clearTimeout(this.next)
      this.next = null
    }
  }
}

class TestTimeout implements Timeout {
  constructor(public task: Task, private onCancel: ((self: Timeout) => void) | null) {}
  public cancel(): void {
    if (this.onCancel !== null) {
      const c = this.onCancel
      this.onCancel = null
      c(this)
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
  tick: number
  timeout: TestTimeout
}
