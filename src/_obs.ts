import { checkObservable } from "./_check"
import { Source } from "./_core"
import { In, Out } from "./_interfaces"
import { EventStream, EventStreamDispatcher, isEventStream } from "./EventStream"
import { Observable } from "./Observable"
import { isProperty, Property, PropertyDispatcher } from "./Property"

export function makeObservable<ObsValueType, NewValueType, ObsType = Observable<ObsValueType>>(
  parent: In<ObsType, ObsValueType>,
  source: Source<NewValueType>,
): Out<ObsType, NewValueType> {
  checkObservable(parent)
  return (isProperty(parent) ? makeProperty(source) : makeEventStream(source)) as any
}

export function makeEventStream<T>(source: Source<T>): EventStream<T> {
  return new EventStream(new EventStreamDispatcher(source))
}

export function makeProperty<T>(source: Source<T>): Property<T> {
  return new Property(new PropertyDispatcher(source))
}

/**
 * Test whether the given value is Francis observable or not
 * @param x - Value to be tested
 * @returns `true` if value extends observable, otherwise `false`
 * @public
 */
export function isObservable<T>(x: any): x is Observable<T> {
  return isEventStream(x) || isProperty(x)
}
