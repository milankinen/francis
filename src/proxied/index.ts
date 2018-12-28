import { DISPATCHER } from "../_symbols"
import { is } from "../_util"
import { Atom, view } from "../Atom"
import { EventStream } from "../EventStream"
import { Observable } from "../Observable"
import { map } from "../operators/map"
import { Property } from "../Property"
import { Proxied } from "./types"

export * from "./types"

export function proxied<T>(obs: Atom<T>): Proxied.Atom<T>
export function proxied<T>(obs: Property<T>): Proxied.Property<T>
export function proxied<T>(obs: EventStream<T>): Proxied.EventStream<T>
export function proxied<T>(obs: Observable<T>): Proxied.Observable<T> {
  return proxy(obs, void 0, null)
}

function proxy(target: any, name: string | undefined, ctx: any): any {
  // tslint:disable-next-line:only-arrow-functions
  return new Proxy(function() {}, {
    getPrototypeOf(_: any): any {
      return Object.getPrototypeOf(target)
    },
    get(_: any, prop: any, receiver: any): any {
      if (prop === DISPATCHER) {
        return target[DISPATCHER]
      } else {
        const val = (is(target, Atom)
          ? view(target, prop)
          : map((x: any) => x[prop], target)) as any
        return proxy(val, prop, target)
      }
    },
    apply(_: any, __: any, args: any[]): any {
      const val = map(x => {
        const f = (name !== undefined ? (x as any)[name] : undefined) as any
        if (typeof f !== "function") {
          throw new TypeError(`${name} is not a function`)
        }
        return f.apply(x, args)
      }, ctx)
      return proxy(val, void 0, null)
    },
  })
}
