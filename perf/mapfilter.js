const Benchmark = require("benchmark")
const B = require("baconjs/dist/Bacon.min")
const Rx = require("rxjs-compat")
const xs = require("xstream")
const F = require("../dist/francis.bacon.min")

let suite = new Benchmark.Suite()
suite = initAll(suite, 100000, 1)
suite = initAll(suite, 1000, 100)
suite
  .on("complete", function() {
    this.forEach(test => console.log(test.toString()))
  })
  .run({ async: true })

function initAll(suite, e, n) {
  const descr = `${e} x events with .map().filter() x ${n}`
  return suite
    .add(`francis ${descr}`.padEnd(80), init(F, e, n))
    .add(`bacon ${descr}`.padEnd(80), init(B, e, n))
    .add(`rxjs ${descr}`.padEnd(80), initR(e, n))
    .add(`xstream ${descr}`.padEnd(80), initX(e, n))
}

function init(F, nEvents, nDepth) {
  return {
    defer: true,
    fn: d => {
      const events = Array.from(Array(nEvents)).map((x, i) => i)
      const stream = F.fromArray(events)
      const res = Array.from(Array(nDepth)).reduce(s => s.map(inc).filter(even), stream)
      res.subscribe(e => e.isEnd && d.resolve())
    },
  }
}

function initR(nEvents, nDepth) {
  return {
    defer: true,
    fn: d => {
      const events = Array.from(Array(nEvents)).map((x, i) => i)
      const stream = Rx.Observable.fromPromise(Promise.resolve(Rx.Observable.from(events)))
        .switch()
        .share()

      const res = Array.from(Array(nDepth)).reduce(s => s.map(inc).filter(even), stream)
      res.subscribe({ next: ident, complete: () => d.resolve() })
    },
  }
}

function initX(nEvents, nDepth) {
  return {
    defer: true,
    fn: d => {
      const events = Array.from(Array(nEvents)).map((x, i) => i)
      const stream = xs.Stream.fromPromise(Promise.resolve(xs.Stream.fromArray(events))).flatten()
      const res = Array.from(Array(nDepth)).reduce(s => s.map(inc).filter(even), stream)
      res.addListener({ next: ident, complete: () => d.resolve() })
    },
  }
}

function inc(x) {
  return x + 1
}

function even(x) {
  return x % 2 === 0
}

function ident(x) {
  return x
}
