import { Dispose, ValueHandler } from "../_interfaces"
import { Observable } from "../Observable"
import { subscribe } from "./subscribe"

export function onValue<T>(handler: ValueHandler<T>, observable: Observable<T>): Dispose {
  return subscribe(e => e.hasValue && handler((e as any).value as T), observable)
}
