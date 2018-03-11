import { Scheduler, Task } from "./Scheduler"

export class DefaultScheduler implements Scheduler {
  private tasks: Task[] = []
  private defered: TimeSlot | null = null
  private next: Promise<any> | null = null
  private slots: TimeSlot[] = []
  private tid: NodeJS.Timer | null = null
  private tick: number = 0

  public schedulePropertyActivation(task: Task): void {
    this._scheduleNow(task)
  }

  public scheduleAbortSubscription(task: Task): void {
    this._scheduleNow(task)
  }

  public scheduleEventStreamActivation(task: Task): void {
    if (this.defered === null) {
      this.defered = new TimeSlot(0, task)
      this._resetNext()
    } else {
      this.defered.tasks.push(task)
    }
  }

  public scheduleDelayed(task: Task, delay: number): void {
    const time = (this.tick || Date.now()) + delay
    const slot = getTimeSlot(this.slots, time)
    if (slot === undefined) {
      if (binaryInsert(this.slots, new TimeSlot(time, task)) === 0) {
        this._resetTimer()
      }
    } else {
      slot.tasks.push(task)
    }
  }

  public run(): void {
    if (this.tick === 0) {
      const tasks = this.tasks
      for (let i = 0; i < tasks.length; i++) {
        tasks[i].run()
      }
      this.tasks = []
      this.tick = 0
    }
  }

  public _resetTimer(): void {
    const tid = this.tid
    if (tid !== null) {
      clearTimeout(tid)
    }
    const delay = Math.max(this.slots[0].time - this.tick, 0)
    this.tid = setTimeout(() => {
      this.tid = null
      this.tasks = (this.slots.shift() as TimeSlot).tasks
      this.run()
    }, delay)
  }

  public _resetNext(): void {
    if (this.next === null) {
      this.next = Promise.resolve(this)
        .then(runNext)
        .catch(console.error)
    }
  }

  public _runNext(): void {
    this.tasks = (this.defered as TimeSlot).tasks
    this.next = this.defered = null
    this.run()
  }

  private _scheduleNow(task: Task): void {
    this.tasks.push(task)
  }
}

function runNext(scheduler: DefaultScheduler): void {
  scheduler._runNext()
}

class TimeSlot implements Ordered<TimeSlot> {
  public tasks: Task[] = []

  constructor(public time: number, initialTask: Task) {
    this.tasks.push(initialTask)
  }

  public compare(other: TimeSlot): number {
    return this.time - other.time
  }
}

function getTimeSlot(slots: TimeSlot[], time: number): TimeSlot | undefined {
  let min = 0
  let max = slots.length
  while (true) {
    if (min === max) {
      return undefined
    }
    const i = min + (((max - min) / 2) >> 0)
    const result = time - slots[i].time
    if (result === 0) {
      return slots[i]
    } else if (result < 0) {
      max = i
    } else {
      min = i + 1
    }
  }
}

interface Ordered<T> {
  compare(other: T): number
}

function binaryInsert<T extends Ordered<T>>(xs: T[], x: T): number {
  let min = 0
  let max = xs.length
  while (true) {
    if (min === max) {
      xs.splice(min, 0, x)
      return min
    }
    const i = min + (((max - min) / 2) >> 0)
    const result = x.compare(xs[i])
    if (result < 0) {
      max = i
    } else {
      min = i + 1
    }
  }
}
