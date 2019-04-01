import { checkObservable } from "../_check"
import { invoke, Invokeable, sendNextInTx, Source, Subscriber, Subscription } from "../_core"
import { In, Out } from "../_interfaces"
import { makeEventStream } from "../_obs"
import { curry2 } from "../_util"
import { EventStream } from "../EventStream"
import { dispatcherOf, Observable } from "../Observable"
import { isProperty, Property, PropertyDispatcher } from "../Property"
import { scheduleActivationTask } from "../scheduler/index"
import { Identity } from "./_base"

/**
 * For `EventStream`, this operator adds an extra event with the given value
 * to the beginning of the stream.
 *
 * For `Property`, this operator ensures that the property has an initial value.
 * If the property already has an initial value then this operator is a no-op.
 *
 * @param value Value to be added to the stream / property's initial value
 * @param observable Source observable
 *
 * @example
 *
 * F.pipe(F.once(1),
 *  F.startWith(2),
 *  F.startWith(3),
 *  F.log("EventStream"))
 * // logs: 3, 2, 1, <end>
 *
 * F.pipe(F.constant(1),
 *  F.startWith(2),
 *  F.startWith(3),
 *  F.log("Property"))
 * // logs: 1, <end>
 *
 * @public
 */
export const startWith: CurriedStartWith = curry2(_startWith)
interface CurriedStartWith {
  <ObsType, ValueType>(value: ValueType, observable: In<ObsType, ValueType>): Out<
    ObsType,
    ValueType
  >
  <ValueType>(value: ValueType): <ObsType>(
    observable: In<ObsType, ValueType>,
  ) => Out<ObsType, ValueType>
}

function _startWith<T>(value: T, observable: Observable<T>): Observable<T> {
  checkObservable(observable)
  return isProperty<T>(observable)
    ? _startWithP(value, observable)
    : _startWithE(value, observable as EventStream<T>)
}

export function _startWithE<T>(value: T, stream: EventStream<T>): EventStream<T> {
  return makeEventStream(new StartWithE(dispatcherOf(stream), value))
}

export function _startWithP<T>(value: T, property: Property<T>): Property<T> {
  return new Property(new StartWithDispatcher(dispatcherOf(property), value))
}

class StartWithDispatcher<T> extends PropertyDispatcher<T> {
  constructor(source: Source<T>, value: T) {
    super(source)
    this.val = value
  }
}

class StartWithE<T> extends Identity<T> {
  constructor(source: Source<T>, private readonly value: T) {
    super(source)
  }

  public subscribe(subscriber: Subscriber<T>, order: number): Subscription {
    return new StartWithESubscription(this, super.subscribe(subscriber, order))
  }

  public start(): void {
    this.active && sendNextInTx(this.sink, this.value)
  }
}

class StartWithESubscription<T> implements Subscription, Invokeable<undefined> {
  private d: boolean = false
  constructor(private swe: StartWithE<T>, private s: Subscription) {}

  public activate(initialNeeded: boolean): void {
    scheduleActivationTask(invoke(this))
    this.swe.activate(initialNeeded)
  }

  public invoke(): void {
    !this.d && this.swe.start()
  }

  public dispose(): void {
    this.d = true
    this.s.dispose()
  }

  public reorder(order: number): void {
    this.s.reorder(order)
  }
}
