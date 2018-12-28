import { JSMap, JSSet } from "./_interfaces"
import { findIndex } from "./_util"

type MapCtor = new <K, V>() => JSMap<K, V>

type SetCtor = new <V>() => JSSet<V>

export const Map: MapCtor = getMapOrPolyfill()

export const Set: SetCtor = getSetOrPolyfill()

function getMapOrPolyfill(): any {
  // NOTE: this is not complete polyfill but size/speed optimized version
  // tailored forFrancis use only
  return (
    getJsMapClass() ||
    class MapPolyfill<K, V> {
      public size: number = 0
      private items: Array<{ k: K; v: V }> = []
      public has(k: K): boolean {
        return findIndex(it => it.k === k, this.items) !== -1
      }
      public get(k: K): V | undefined {
        // we know that get is always called after "has" so index does exist
        const { items } = this
        return items[findIndex(it => it.k === k, items)].v
      }
      public set(k: K, v: V): void {
        // we know that get is always called after "has" has returned false so we can make O(1) insertion here
        this.items.push({ k, v })
        ++this.size
      }
      public forEach(fn: (v: V, k: K) => void): void {
        this.items.forEach(it => fn(it.v, it.k))
      }
    }
  )
}

function getSetOrPolyfill(): any {
  // NOTE: this is not complete polyfill but size/speed optimized version
  // tailored forFrancis use only
  return (
    getJsSetClass() ||
    class SetPolyfill<V> {
      private items: V[] = []
      public has(v: V): boolean {
        return findIndex(it => it === v, this.items) !== -1
      }
      public add(v: V): void {
        // we know that add is always called after "has" has returned false so we can make O(1) insertion here
        this.items.push(v)
      }
      public clear(): void {
        this.items = []
      }
    }
  )
}

function getJsSetClass(): any {
  try {
    // tslint:disable-next-line:function-constructor
    return new Function("new Set();return Set;").apply(null)
  } catch {
    return null
  }
}

function getJsMapClass(): any {
  try {
    // tslint:disable-next-line:function-constructor
    return new Function("new Map();return Map;").apply(null)
  } catch {
    return null
  }
}
