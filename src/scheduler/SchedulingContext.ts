import { __DEVELOPER__, logAndThrow } from "../_assert"
import { Transaction } from "../_tx"
import { isFunction } from "../_util"
import { OnTimeout, Task, Timeout } from "./index"

const scheduleMicroTask = createMicroTaskScheduler()

export class SchedulingContext {
  private top: SchedulerFrame
  private root: SchedulerFrame

  constructor() {
    this.root = this.top = new RootFrame()
  }

  public hasActivations(): boolean {
    return this.top.hasActivations()
  }

  public getRootTx(): Transaction {
    return this.root.tx
  }

  public abort(): void {
    this.top.abort()
  }

  public stepIn(): Transaction {
    this.top = this.top.stepIn()
    return this.top.tx
  }

  public stepOut(): Transaction {
    this.top = this.top.stepOut()
    return this.top.tx
  }

  public handleActivations(): void {
    this.top.handleActivations()
  }

  public scheduleActivation(task: Task): void {
    this.top.scheduleActivation(task)
  }

  public scheduleTimeout(onTimeout: OnTimeout, delay: number): Timeout {
    return new BasicTimeout(setTimeout(() => onTimeout.due(), delay))
  }
}

interface SchedulerFrame {
  readonly tx: Transaction
  hasActivations(): boolean
  scheduleActivation(task: Task): void
  handleActivations(): void
  abort(): void
  stepIn(): SchedulerFrame
  stepOut(): SchedulerFrame
}

abstract class BaseFrame implements SchedulerFrame {
  public readonly tx: Transaction

  private activations: Task[] = []
  private cursor: number = 0

  constructor(parent: SchedulerFrame | null) {
    this.tx = new Transaction(parent !== null ? parent.tx : null)
  }

  public abstract handleActivations(): void
  public abstract stepIn(): SchedulerFrame
  public abstract stepOut(): SchedulerFrame

  public abort(): void {
    this.activations = []
    this.cursor = 0
  }

  public scheduleActivation(task: Task): void {
    this.activations.push(task)
  }

  public hasActivations(): boolean {
    return this.activations.length > 0
  }

  protected runActivations(): void {
    const { activations } = this
    while (this.cursor < activations.length) {
      activations[this.cursor++].run()
    }
    this.activations = []
    this.cursor = 0
  }
}

class RootFrame extends BaseFrame {
  private scheduled: boolean = false
  // pre-allocating some inner frames give a huge performance boost because
  // stepIn/stepOut may occur often if codebase is using flatMap* extensively
  // 100 frames should be plenty enough for any normal (and HC) applications,
  // usually < 10 is sufficient
  private inner: InnerFrame = new InnerFrame(this, 100)

  constructor() {
    super(null)
  }

  public handleActivations(): void {
    if (this.scheduled === false && this.hasActivations()) {
      this.scheduled = true
      scheduleMicroTask(() => {
        this.scheduled = false
        this.runActivations()
      })
    }
  }

  public stepIn(): SchedulerFrame {
    return this.inner
  }

  public stepOut(): SchedulerFrame {
    // this function should never be called
    logAndThrow(__DEVELOPER__ ? "**BUG** RootFrame should not be stepped out" : "BUG")
    return this
  }
}

class InnerFrame extends BaseFrame {
  private inner: InnerFrame | null

  constructor(private parent: SchedulerFrame, rec: number) {
    super(parent)
    this.inner = rec > 0 ? new InnerFrame(this, rec - 1) : null
  }

  public abort(): void {
    super.abort()
    this.parent.abort()
  }

  public hasActivations(): boolean {
    return super.hasActivations() || this.parent.hasActivations()
  }

  public handleActivations(): void {
    // activations will be handled in stepOut phase
  }

  public stepIn(): SchedulerFrame {
    return this.inner !== null ? this.inner : new InnerFrame(this, 0)
  }

  public stepOut(): SchedulerFrame {
    this.runActivations()
    return this.parent
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

type MicroTaskScheduler = (task: () => void) => void

function createMicroTaskScheduler(): MicroTaskScheduler {
  const tryCreate = (opt: () => any) => {
    try {
      return opt()
    } catch {
      return null
    }
  }

  const firstOf = (...options: Array<() => any | null>): any | null =>
    options.reduce((p, o) => p || tryCreate(o), null)

  const makeNextTickScheduler = () => {
    // tslint:disable-next-line:function-constructor
    return new Function(
      "return (typeof process.nextTick==='function')?(function nextTick(t){return process.nextTick(t);}):null;",
    ).apply(null) as any
  }

  const makePromiseScheduler = () => {
    if (!isFunction(Promise.resolve)) return null
    return function promise(task: () => void) {
      Promise.resolve(null).then(_ => task())
    }
  }

  const makeSetImmediateScheduler = () => {
    // tslint:disable-next-line:function-constructor
    return new Function(
      "return (typeof setImmediate==='function')?(function immediate(t){return setImmediate(t);}):null;",
    ).apply(null) as any
  }

  const scheduleTimeout = function timeout(task: () => void) {
    setTimeout(task, 0)
  }

  const scheduler = firstOf(makeNextTickScheduler, makePromiseScheduler, makeSetImmediateScheduler)
  return scheduler || scheduleTimeout
}
