import * as R from "ramda"
import { withContext } from "../src/scheduler/index"
import { TestSchedulingContext } from "../src/scheduler/TestSchedulingContext"

export type RunnerSetupFn = (
  record: (x: any) => any,
  wait: (t: number, op: () => any) => void,
) => void
export type RunnerAfterFn = (recording: any[]) => void

export function runner(): ObservableRunner {
  return new ObservableRunner(() => {}, () => {})
}

// tslint:disable-next-line:no-shadowed-variable
export const Sync = new class Sync {}()

export function labeled(record: any, label: string) {
  return (value: any) => record({ label, value })
}

export function byLabel(recording: any[]): any {
  return R.map(R.map(R.prop("value")), R.groupBy(R.prop("label") as any, recording))
}

export class ObservableRunner {
  constructor(private setupFn: RunnerSetupFn, private afterFn: RunnerAfterFn) {}

  public setup(setupFn: RunnerSetupFn): ObservableRunner {
    return new ObservableRunner(setupFn, this.afterFn)
  }

  public after(after: RunnerAfterFn): ObservableRunner {
    return new ObservableRunner(this.setupFn, after)
  }

  public run(done: jest.DoneCallback): void {
    const { setupFn, afterFn } = this
    withContext(new TestSchedulingContext(), (ctx: TestSchedulingContext, ready: () => void) => {
      const recording = [] as any[]
      const record = (x: any) => recording.push(x)
      const wait = (t: number, op: () => any) => {
        ctx.scheduleTimeout({ due: op }, t)
      }
      try {
        setupFn(record, wait)
        ctx.runTest(scheduleErr => {
          try {
            afterFn(recording)
            ready()
            scheduleErr ? done(scheduleErr) : done()
          } catch (checkErr) {
            ready()
            done(checkErr)
          }
        })
      } catch (e) {
        ctx.abort()
        done(e)
      }
    })
  }
}
