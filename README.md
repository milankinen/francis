# Francis

[![Build status](https://img.shields.io/travis/milankinen/francis/master.svg?style=flat-square)](https://travis-ci.org/milankinen/francis)
[![npm](https://img.shields.io/npm/v/francis.svg?style=flat-square)](https://www.npmjs.com/package/francis)
[![Bundle size (minified + gzip)](https://img.shields.io/bundlephobia/minzip/francis.svg?style=flat-square)](https://bundlephobia.com/result?p=francis)
[![Dependencies](https://david-dm.org/milankinen/francis.svg?style=flat-square)](https://github.com/milankinen/francis/blob/master/package.json)

Francis is a reactive programming library for TypeScript and JavaScript, inspired by
[Bacon.js](https://github.com/baconjs/bacon.js) and [most](https://github.com/cujojs/most),
with focus on developer friendly stream semantics, high performance and functional usage.

```typescript
import * as F from "francis"

F.pipe(
  F.interval(1000, "!"),
  F.scan("Francis", (s, x) => s + x),
  F.map(s => "Hello " + s.toUpperCase()),
  F.skip(2),
  F.take(2),
  F.onValue(console.log),
)
// Hello FRANCIS!!
// Hello FRANCIS!!!
```

## Motivation

**tl;dr** I wanted a functional-first, treeshakeable [Bacon.js](https://github.com/baconjs/bacon.js)
that is [6-10x faster](perf#latest-test-results), has lower memory footprint and is written
entirely with TypeScript.


## Installation

```bash
npm i --save francis
```

## API

See **[API docs](https://milankinen.github.io/francis)** (still WIP!) for complete
reference of the available functions and their usage.

### Bacon.js compatibility

Because the stream semantics are same (with [few differences](BACON.md)) in Francis and
Bacon, Francis provides a drop-in replacement module for Bacon. The required changes
in codebase are:

```diff
-import B from "baconjs"
+import B from "francis/bacon"

B.once("Bacon")
  .map(x => "Hello " + x + "!")
  .map(".toUpperCase")
  .onValue(console.log)
```

### Experimental proxied API

You can convert any Francis observable to a "proxied" observable by using `F.proxied`
utility. Proxied observables are just like their "normal" counterparts, but in
addition they provide a way to traverse the underlying data structure by using
the traditional dot notation. And being typed, of course.

**ATTENTION!** This feature is experimental and is probably subject to change.

```ts
import * as F from "francis"

const state = F.proxied(
  F.atom({
    msg: "Tsers",
    inner: { nums: [1, 2, 4, 5] },
  }),
)

// typeof nums === F.Proxied.Atom<num[]>
const { nums } = state.inner
// typeof str === F.Proxied.Property<string>
const str = nums
  .map(n => n + 1)
  .filter(n => n % 2 === 1)
  .join(",")

F.log("str:", str)
F.set(nums, [5, 6])
// logs "3,5" and "7"
```

## License

MIT
