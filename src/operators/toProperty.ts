import { makeProperty } from "../_obs"
import { Observable } from "../Observable"
import { isProperty, Property } from "../Property"
import { identity } from "./_base"

export function toProperty<T>(observable: Observable<T>): Property<T> {
  return isProperty<T>(observable) ? observable : makeProperty(identity(observable.src))
}
