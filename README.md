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

## Oh why?

**Bacon is really great**, especially its transactions and atomic updates. That said, it consumes
a lot of memory and loses in performance compared to other stream libraries (especially when using
higher order observables such as `flatMap`). **And that is where Francis steps in:** by being
completely written with TypeScript, having a functional-first API and borrowing some concepts
from [most](https://github.com/cujojs/most), it provides the same stream semantics as Bacon,
[improved performance](perf#latest-test-results) and lower memory consumption. And of course being
typed and 100% tree shakeable.

## Installation

```bash
npm install --save francis
```

## API

Every operator in Francis is [curried](https://en.wikipedia.org/wiki/Currying). This allows
operator piping so composing with type information and enables efficient tree shaking for
modern bundlers because observable proptotypes remain untouched.

### Caveats

TODO: explain that operators lose `EventStream`/`Property` type information; must be
casted with `asProperty`/`asEventStream` is correct return type is needed.

### Reference

`TODO...`

## Object oriented API

For those prefering object oriented API, Francis provides `francis/bacon` module which
adds observable methods to `EventStream` and `Property` prototypes. Because the stream
semantics are almost same in Bacon and Francis, `francis/bacon` can also be used as a
a drop-in replacement module for `baconjs` (see the differences below). This module
also implements Bacon's [function construction rules](https://github.com/baconjs/bacon.js#function-construction-rules)
and other JS-related API changes. The required change in codebase is:

```diff
-import B from "baconjs"
+import B from "francis/bacon"

B.once("Bacon")
  .map(x => "Hello " + x + "!")
  .map(".toUpperCase")
  .onValue(console.log)
```

### Differences to Bacon

* Francis does not distinguish `Initial` and `Next` events. If your code uses (or assumes)
  `Bacon.Initial`, it will break

* Francis does not have `bus.plug(...)` because it leaves streams open forever when
  plugging bus to itself

* Francis does not support `eventTransformer` for `from*` observable factory functions
  (at least yet)

* Due to internal optimizations, latest subscribers receive their emit first from the
  upstream whereas in Bacon the order is opposite. In transactions, this is not the issue
  due to atomic updates but if your code otherwise relies on this undocumented feature,
  it will break. For example:

```js
const msg = F.once("tsers")
msg.log("x")
msg.log("y")
// Francis output
// > y tsers
// > x tsers
// > y <end>
// > x <end>
// Bacon output
// > x tsers
// > y tsers
// > x <end>
// > y <end>
```

### Non-implemented operators

The following operators are yet to be implemented:

- [ ] `withHandler`
- [ ] `toString`
- [ ] `Desc`
- [ ] `fromESObservable`
- [ ] `fromPromise`
- [ ] `$.asEventStream`
- [ ] `retry`
- [ ] `try`
- [ ] `withDescription`
- [ ] `inspect`
- [ ] `withStateMachine`
- [ ] `awaiting`
- [ ] `decode`
- [ ] `endOnError`
- [ ] `toESObservable`
- [ ] `groupBy`
- [ ] `firstToPromise`
- [ ] `toPromise`
- [ ] `holdWhen`
- [ ] `bufferWithTime(f)`

## License

MIT
