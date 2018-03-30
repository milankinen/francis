import * as Event from "./Event"
import { EventStream } from "./EventStream"
import { Property } from "./Property"

export type Projection<A, B> = (val: A) => B

export type Predicate<A> = (val: A) => boolean

export type Dispose = () => void

export type AnyEvent<T> = Event.Next<T> | Event.Initial<T> | Event.Error | Event.End

export type AnyObs<A> = Property<A> | EventStream<A>

export type Handler<T> = (event: AnyEvent<T>) => typeof Event.noMore | any
