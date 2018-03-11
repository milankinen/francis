import * as Event from "./Event"

export type Projection<A, B> = (val: A) => B

export type Predicate<A> = (val: A) => boolean

export type Dispose = () => void

export type AnyEvent<T> = Event.Next<T> | Event.Initial<T> | Event.Error | Event.End

export type Handler<T> = (event: AnyEvent<T>) => typeof Event.noMore | undefined
