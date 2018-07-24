import { EventStream } from "../EventStream"
import { Observable } from "../Observable"
import { Property } from "../Property"
import { map } from "./map"

export function doAction<T>(f: (val: T) => void, observable: Property<T>): Property<T>
export function doAction<T>(f: (val: T) => void, observable: EventStream<T>): EventStream<T>
export function doAction<T>(f: (val: T) => void, observable: Observable<T>): Observable<T>
export function doAction<T>(f: (val: T) => void, observable: Observable<T>): Observable<T> {
  const eff = (val: T): T => {
    f(val)
    return val
  }
  return map(eff, observable)
}
