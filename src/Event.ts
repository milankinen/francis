import { JSError } from "./_util"

const ident = new class Ident {}()

export const noMore = new class NoMore {}()
export const more = new class More {}()

export interface Event {
  hasValue: boolean
  isNext: boolean
  isInitial: boolean
  isError: boolean
  isEnd: boolean
}

export function isEvent(x: any): x is Event {
  return x && x.__ident === ident
}

// prettier-ignore
export class Next<T> implements Event {
  public hasValue!: boolean
  public isNext!: boolean
  public isInitial!: boolean
  public isError!: boolean
  public isEnd!: boolean
  constructor(public value: T) {}
}

export function isNext<T>(e: Event): e is Next<T> {
  return e.isNext
}

// prettier-ignore
export class Error implements Event {
  public hasValue!: boolean
  public isNext!: boolean
  public isInitial!: boolean
  public isError!: boolean
  public isEnd!: boolean
  constructor(public error: JSError) {}
}
export function isError(e: Event): e is Error {
  return e.isError
}

// prettier-ignore
export class End implements Event {
  public hasValue!: boolean
  public isNext!: boolean
  public isInitial!: boolean
  public isError!: boolean
  public isEnd!: boolean
}

export function isEnd(e: Event): e is End {
  return e.isEnd
}

// tslint:disable-next-line:align max-line-length semicolon whitespace
;(Next.prototype as any).__ident = (Error.prototype as any).__ident = (End.prototype as any).__ident = ident

Next.prototype.hasValue = true
Next.prototype.isNext = true
Next.prototype.isInitial = false
Next.prototype.isError = false
Next.prototype.isEnd = false

Error.prototype.hasValue = false
Error.prototype.isNext = false
Error.prototype.isInitial = false
Error.prototype.isError = true
Error.prototype.isEnd = false

End.prototype.hasValue = false
End.prototype.isNext = false
End.prototype.isInitial = false
End.prototype.isError = false
End.prototype.isEnd = true
