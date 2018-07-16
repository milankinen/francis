import * as R from "ramda"

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

    jest.useFakeTimers()
    const recording = [] as any[]
    const record = (x: any) => recording.push(x)
    const wait = (t: number, op: () => any) => {
      setTimeout(op, t)
    }

    let complete = false
    setupFn(record, wait)
    wait(10000, () => {
      complete = true
      jest.useRealTimers()
      afterFn(recording)
      done()
    })
    while (!complete) {
      jest.runAllTicks()
      jest.runAllImmediates()
      jest.advanceTimersByTime(1)
    }
  }
}
