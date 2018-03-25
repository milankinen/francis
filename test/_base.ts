import { Scheduler, withScheduler } from "../src/scheduler/index"
import { TestScheduler } from "../src/scheduler/TestScheduler"

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
    const NONE = {}
    withScheduler(new TestScheduler(), (scheduler: TestScheduler, ready: () => void) => {
      const recording = []
      const record = x => recording.push(x)
      const wait = (t: number, op: () => any) => {
        scheduler.scheduleTimeout({ due: op }, t)
      }
      setupFn(record, wait)
      scheduler.consume(scheduleErr => {
        try {
          afterFn(recording)
          ready()
          scheduleErr ? done(scheduleErr) : done()
        } catch (checkErr) {
          ready()
          done(checkErr)
        }
      })
    })
  }
}