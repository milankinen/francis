import { Dispose } from "../_interfaces"
import { Transaction } from "../_tx"
import { curry2 } from "../_util"
import { Observable } from "../Observable"
import { Eff, runEffects } from "./_eff"

export const log: CurriedLog = curry2(_log)
export interface CurriedLog {
  (label: string | undefined, observable: Observable<any>): Dispose
  (label: string | undefined): (observable: Observable<any>) => Dispose
}

function _log<T>(label: string | undefined, observable: Observable<T>): Dispose {
  const logger = new Logger(label)
  runEffects(logger, observable)
  return function dispose(): void {
    logger.dispose()
  }
}

class Logger<T> extends Eff<T> {
  constructor(private label: string | undefined) {
    super()
  }

  public next(tx: Transaction, val: T): void {
    this.log(val)
  }

  public error(tx: Transaction, err: Error): void {
    this.log("<error>", err)
  }

  public end(tx: Transaction): void {
    this.log("<end>")
    this.dispose()
  }

  private log(...msgs: any[]): void {
    const args: any[] = this.label === undefined ? msgs : [this.label, ...msgs]
    // tslint:disable-next-line:no-console
    console.log(...args)
  }
}
