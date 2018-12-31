# Bacon.js compatibility

For those prefering object oriented API, Francis provides `francis/bacon` module which
adds observable methods to `EventStream` and `Property` prototypes. Because the stream
semantics are almost same in Bacon and Francis, `francis/bacon` can also be used as a
a drop-in replacement module for `baconjs` (see the differences below).

This module also implements Bacon's [function construction rules](https://github.com/baconjs/bacon.js#function-construction-rules)
and other JS-related API changes.

```diff
-import B from "baconjs"
+import B from "francis/bacon"

B.once("Bacon")
  .map(x => "Hello " + x + "!")
  .map(".toUpperCase")
  .onValue(console.log)
```

### Differences to Bacon

Although the general stream and transaction semantics are same, there are few differences,
mainly because of the implementation differences:

* Francis does not distinguish `Initial` and `Next` events. If your code uses (or assumes)
  `Bacon.Initial`, it will break

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
- [ ] `$.asEventStream`
- [ ] `retry`
- [ ] `try`
- [ ] `withDescription`
- [ ] `inspect`
- [ ] `withStateMachine`
- [ ] `decode`
- [ ] `endOnError`
- [ ] `toESObservable`
- [ ] `groupBy`
- [ ] `holdWhen`
- [ ] `bufferWithTime(f)`