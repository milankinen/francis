const Benchmark = require("benchmark")
const B = require("baconjs/dist/Bacon.min")
const Rx = require("rxjs")
const xs = require("xstream")
const F = require("../dist/francis.bacon.min")

let suite = new Benchmark.Suite()
suite = initAll(suite, 100, 100)
suite = initAll(suite, 10, 1000)
suite = initAll(suite, 1000, 10)
suite
  .on("complete", function() {
    this.forEach(test => console.log(test.toString()))
  })
  .run({ async: true })

function initAll(suite, o, i) {
  const descr = `fromArray([... x ${o}]).flatMapLatest([... x ${i}])`
  return suite
    .add(`francis ${descr}`.padEnd(80), init(F, "f", o, i))
    .add(`bacon ${descr}`.padEnd(80), init(B, "b", o, i))
    .add(`rxjs ${descr}`.padEnd(80), initR(o, i))
    .add(`xstream ${descr}`.padEnd(80), initX(o, i))
}

function init(F, l, nOuter, nInner) {
  const outerEvents = Array.from(Array(nOuter)).map((x, i) => i)
  const innerEvents = Array.from(Array(nInner)).map((x, i) => i)
  return {
    defer: true,
    fn: d => {
      let sum = 0
      F.fromArray(outerEvents)
        .flatMapLatest(x => F.fromArray(innerEvents).map(y => x + y))
        .subscribe(e => e.isEnd && d.resolve())
    },
  }
}

function initR(nOuter, nInner) {
  const outerEvents = Array.from(Array(nOuter)).map((x, i) => i)
  const innerEvents = Array.from(Array(nInner)).map((x, i) => i)

  return {
    defer: true,
    fn: d => {
      Rx.Observable.fromPromise(Promise.resolve(Rx.Observable.from(outerEvents)))
        .switch()
        .switchMap(x => Rx.Observable.from(innerEvents).map(y => x + y))
        .subscribe({ complete: () => d.resolve() })
    },
  }
}

function initX(nOuter, nInner) {
  const outerEvents = Array.from(Array(nOuter)).map((x, i) => i)
  const innerEvents = Array.from(Array(nInner)).map((x, i) => i)
  return {
    defer: true,
    fn: d => {
      xs.Stream.fromPromise(Promise.resolve(xs.Stream.fromArray(outerEvents)))
        .flatten()
        .map(x => xs.Stream.fromArray(innerEvents).map(y => x + y))
        .flatten()
        .addListener({ next: ident, complete: () => d.resolve() })
    },
  }
}

function ident(x) {
  return x
}
