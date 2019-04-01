import { checkProperty } from "../_check"
import { curry2 } from "../_util"
import { Observable } from "../Observable"
import { Property } from "../Property"
import { _combine } from "./combine"
import { map } from "./map"

export type Falsy = 0 | false | null | "" | undefined

export type Result<A, B> = A extends Falsy ? A : (Exclude<A, Falsy> | B)

export const and: CurriedAnd = curry2(_and)
export interface CurriedAnd {
  <A, B>(a: Observable<A>, b: Observable<B>): Property<Result<A, B>>
  <A, B>(a: Observable<A>): (b: Observable<B>) => Property<Result<A, B>>
}

export const or: CurriedOr = curry2(_or)
export interface CurriedOr {
  <A, B>(a: Observable<A>, b: Observable<B>): Property<Result<A, B>>
  <A, B>(a: Observable<A>): (b: Observable<B>) => Property<Result<A, B>>
}

export function not<A>(a: Observable<A>): Observable<boolean> {
  checkProperty(a)
  return map(x => !x, a)
}

function _and<A, B>(a: Property<A>, b: Property<B>): Property<Result<A, B>> {
  checkProperty(a)
  checkProperty(b)
  return _combine(xs => xs[0] && xs[1], [a, b] as any) as any
}

function _or<A, B>(a: Property<A>, b: Property<B>): Property<Result<A, B>> {
  checkProperty(a)
  checkProperty(b)
  return _combine(xs => xs[0] || xs[1], [a, b] as any) as any
}
