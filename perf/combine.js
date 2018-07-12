const Benchmark = require("benchmark")
const B = require("baconjs/dist/Bacon.min")
const Rx = require("rxjs-compat")
const xs = require("xstream")
const F = require("../dist/francis.bacon.min")

let suite = new Benchmark.Suite()
suite = initAll(suite, 1000, 10, 40)
suite = initAll(suite, 10000, 2, 2)
suite = initAll(suite, 100, 1000, 2)
suite
  .on("complete", function() {
    this.forEach(test => console.log(test.toString()))
  })
  .run({ async: true })

function initAll(suite, e, f, m) {
  const descr = `${e} events x ${f} forks x ${m} maps`
  return suite
    .add(`francis ${descr}`.padEnd(60), init(F, e, f, m))
    .add(`bacon ${descr}`.padEnd(60), init(B, e, f, m))
    .add(`rxjs ${descr}`.padEnd(60), initR(e, f, m))
    .add(`xstream ${descr}`.padEnd(60), initX(e, f, m))
}

function init(F, nEvents, nForks, nMaps) {
  return {
    defer: true,
    fn: d => {
      const events = Array.from(Array(nEvents)).map((x, i) => i)
      const stream = F.fromArray(events)
      const arr = Array.from(Array(nForks)).map(() =>
        Array.from(Array(nMaps)).reduce(s => s.map(ident), stream),
      )
      const res = B.combineAsArray(arr)
      res.subscribe(e => e.isEnd && d.resolve())
    },
  }
}

function initR(nEvents, nForks, nMaps) {
  return {
    defer: true,
    fn: d => {
      const events = Array.from(Array(nEvents)).map((x, i) => i)
      const stream = Rx.Observable.fromPromise(Promise.resolve(Rx.Observable.from(events)))
        .switch()
        .share()
      const arr = Array.from(Array(nForks)).map(() =>
        Array.from(Array(nMaps)).reduce(s => s.map(ident).share(), stream),
      )
      const res = Rx.Observable.combineLatest(...arr)
      res.subscribe({ next: ident, complete: () => d.resolve() })
    },
  }
}

function initX(nEvents, nForks, nMaps) {
  return {
    defer: true,
    fn: d => {
      const events = Array.from(Array(nEvents)).map((x, i) => i)
      const stream = xs.Stream.fromPromise(Promise.resolve(xs.Stream.fromArray(events))).flatten()
      const arr = Array.from(Array(nForks)).map(() =>
        Array.from(Array(nMaps)).reduce(s => s.map(ident), stream),
      )
      const res = xs.Stream.combine(...arr)
      res.addListener({ next: ident, complete: () => d.resolve() })
    },
  }
}

function ident(x) {
  return x
}
