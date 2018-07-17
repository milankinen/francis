import * as R from "ramda"

// tslint:disable-next-line:no-shadowed-variable
export const Sync = new class Sync {}()

export function labeled(record: any, label: string) {
  return (value: any) => record({ label, value })
}

export function byLabel(recording: any[]): any {
  return R.map(R.map(R.prop("value")), R.groupBy(R.prop("label") as any, recording))
}

export type RecordedCodeBlock = (
  record: (x: any) => any,
  wait: (t: number, op: () => any) => void,
) => void

export function run(fn: RecordedCodeBlock): any[] {
  jest.useFakeTimers()
  try {
    const state = {
      complete: false,
      recording: [] as any[],
    }
    const record = (x: any) => {
      state.recording.push(x)
    }
    const wait = (t: number, op: () => any) => {
      setTimeout(op, t)
    }
    fn(record, wait)
    wait(10000, () => (state.complete = true))
    while (!state.complete) {
      jest.runAllTicks()
      jest.runAllImmediates()
      jest.advanceTimersByTime(1)
    }
    return state.recording
  } finally {
    jest.clearAllTimers()
    jest.useRealTimers()
  }
}
