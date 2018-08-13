import { checkProperty } from "../_check"
import { curry2 } from "../_util"
import { Observable } from "../Observable"
import { Property } from "../Property"
import { _combine } from "./combine"
import { map } from "./map"

export type Falsy = 0 | false | null | "" | undefined

export type AndResult<A, B> = A extends Falsy ? A : (Exclude<A, Falsy> | B)

export type OrResult<A, B> = A extends Falsy ? B : (Exclude<A, Falsy> | B)

export interface AndOp {
  <A, B>(a: Observable<A>, b: Observable<B>): Observable<AndResult<A, B>>
  <A, B>(a: Observable<A>): (b: Observable<B>) => Observable<AndResult<A, B>>
}

export interface OrOp {
  <A, B>(a: Observable<A>, b: Observable<B>): Observable<AndResult<A, B>>
  <A, B>(a: Observable<A>): (b: Observable<B>) => Observable<AndResult<A, B>>
}

export const and: AndOp = curry2(_and)
export const or: OrOp = curry2(_or)

export function not<A>(a: Observable<A>): Observable<boolean> {
  checkProperty(a)
  return map(x => !x, a)
}

function _and<A, B>(a: Property<A>, b: Property<B>): Property<AndResult<A, B>> {
  checkProperty(a)
  checkProperty(b)
  return _combine(xs => xs[0] && xs[1], [a, b] as any) as any
}

function _or<A, B>(a: Property<A>, b: Property<B>): Property<OrResult<A, B>> {
  checkProperty(a)
  checkProperty(b)
  return _combine(xs => xs[0] || xs[1], [a, b] as any) as any
}
