import { JSError } from "./_util"

export const noMore = new class NoMore {}()
export const more = new class More {}()

export interface Event {
  hasValue: boolean
  isNext: boolean
  isInitial: boolean
  isError: boolean
  isEnd: boolean
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

// prettier-ignore
export class Initial<T> implements Event {
  public hasValue!: boolean
  public isNext!: boolean
  public isInitial!: boolean
  public isError!: boolean
  public isEnd!: boolean
  constructor(public value: T) {}
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

// prettier-ignore
export class End implements Event {
  public hasValue!: boolean
  public isNext!: boolean
  public isInitial!: boolean
  public isError!: boolean
  public isEnd!: boolean
}

Next.prototype.hasValue = true
Next.prototype.isNext = true
Next.prototype.isInitial = false
Next.prototype.isError = false
Next.prototype.isEnd = false

Initial.prototype.hasValue = true
Initial.prototype.isNext = false
Initial.prototype.isInitial = true
Initial.prototype.isError = false
Initial.prototype.isEnd = false

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
