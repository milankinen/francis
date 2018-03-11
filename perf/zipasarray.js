const Benchmark = require("benchmark")
const B = require("baconjs")
const Rx = require("rxjs")
const xs = require("xstream")
const F = require("../dist/francis.bacon")

let suite = new Benchmark.Suite()
suite = initAll(suite, 100000)
suite
  .on("complete", function() {
    this.forEach(test => console.log(test.toString()))
  })
  .run({ async: true })

function initAll(suite, n) {
  const descr = `${n} x events .zip(a, b, c)`
  return suite
    .add(`francis ${descr}`.padEnd(80), init(F, n))
    .add(`bacon ${descr}`.padEnd(80), init(B, n))
    .add(`rxjs ${descr}`.padEnd(80), initR(n))
}

function init(F, n) {
  const vals = Array.from(Array(n)).map((_, i) => i)
  return {
    defer: true,
    fn: d => {
      const events = F.fromArray(vals)
      const a = events.filter(x => x % 2 === 0 && x < n / 3)
      const b = events.filter(x => x % 3 === 0 && x < n / 2)
      const c = events.filter(x => x % 4 === 0)
      F.zipAsArray(a, b, c).subscribe(e => e.isEnd && d.resolve())
    },
  }
}

function initR(n) {
  const vals = Array.from(Array(n)).map((_, i) => i)
  return {
    defer: true,
    fn: d => {
      const events = Rx.Observable.fromPromise(Promise.resolve(Rx.Observable.from(vals)))
        .switch()
        .share()
      const a = events.filter(x => x % 2 === 0 && x < n / 3)
      const b = events.filter(x => x % 3 === 0 && x < n / 2)
      const c = events.filter(x => x % 4 === 0)
      Rx.Observable.zip(a, b, c).subscribe({ next: ident, complete: () => d.resolve() })
    },
  }
}

function ident(x) {
  return x
}
