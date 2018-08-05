import * as Event from "./Event"
import { EventStream } from "./EventStream"
import { Property } from "./Property"

export type Projection<A, B> = (val: A) => B

export type Predicate<A> = (val: A) => boolean

export type Accum<S, T> = (state: S, value: T) => S

export type Dispose = () => void

export type AnyEvent<T> = Event.Next<T> | Event.Error | Event.End

export type AnyObs<A> = Property<A> | EventStream<A>

export type Handler<T> = (event: AnyEvent<T>) => typeof Event.noMore | any

export type ValueHandler<T> = (val: T) => typeof Event.noMore | any

export type ValuesHandler<T> = (...vals: T[]) => typeof Event.noMore | any

export type ErrorHandler = (err: Error) => typeof Event.noMore | any

export type EndHandler = () => void

export type SinkEvent<T> = T | AnyEvent<T> | Array<T | AnyEvent<T>>

export type SinkResult = typeof Event.noMore | typeof Event.more

export type Sink<T> = (event: SinkEvent<T>) => SinkResult

export type Subscribe<T> = (sink: Sink<T>) => Dispose | any

export type AsyncCallback<T> = (callback: (result: T | AnyEvent<T>) => void) => void

export type AsyncNodeCallback<T> = (
  callback: (error: Error | null, result?: T | AnyEvent<T>) => void,
) => void
