import { Dispose } from "../_interfaces"
import { Transaction } from "../_tx"
import { Observable } from "../Observable"
import { Eff, runEffects } from "./_eff"

export function log<T>(label: string | undefined, observable: Observable<T>): Dispose {
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
    // tslint:disable-next-line:no-console
    console.log.apply(console, this.label === undefined ? msgs : [this.label, ...msgs])
  }
}
