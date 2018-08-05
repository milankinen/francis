import { assert } from "../_assert"
import { curry2 } from "../_util"
import { Observable } from "../Observable"
import { isProperty, Property } from "../Property"
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
  checkProp(a)
  return map(notOp, a)
}

function _and<A, B>(a: Property<A>, b: Property<B>): Property<AndResult<A, B>> {
  checkProp(a)
  checkProp(b)
  return _combine(andOp, [a, b] as any) as any
}

function _or<A, B>(a: Property<A>, b: Property<B>): Property<OrResult<A, B>> {
  checkProp(a)
  checkProp(b)
  return _combine(orOp, [a, b] as any) as any
}

function andOp(vals: any[]): any {
  return vals[0] && vals[1]
}

function orOp(vals: any[]): any {
  return vals[0] || vals[1]
}

function notOp(val: any): boolean {
  return !val
}

function checkProp(x: any): void {
  assert(isProperty(x), "All operands must be Properties")
}
