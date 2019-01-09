const memwatch = require("@airbnb/node-memwatch")
const Benchmark = require("benchmark")
const bytes = require("pretty-bytes")
const { format } = require("util")
const { Francis, Bacon, Kefir } = require("./_libs")

const MEMORY = !!process.env.SHOW_MEMORY_USAGE
let heapStats = []
let gcTime = 0

const withFrancis = f => (...args) => f(Francis, ...args)
const withBacon = f => (...args) => f(Bacon, ...args)
const withKefir = f => (...args) => f(Kefir, ...args)

const resetHeapStats = () => {
  gcTime = 0
  heapStats = []
}

const getAvgMemoryUsage = stats =>
  stats.length ? bytes(Math.floor(stats.reduce((a, s) => a + s, 0) / stats.length)) : "unknown"
const getMaxMemoryUsage = stats =>
  stats.length ? bytes(Math.floor(stats.reduce((a, s) => Math.max(a, s), 0))) : "unknown"

if (MEMORY) {
  memwatch.on("stats", stats => {
    heapStats.push(stats.used_heap_size)
    gcTime += stats.gc_time / 1000000.0
  })
}

const testCases = (label, fn, combinations = []) => {
  const accepted = (testFn, args) => !testFn.accept || testFn.accept(...args)
  const cases = (name, testFn) =>
    combinations
      .map(
        args =>
          accepted(testFn, args) && {
            description:
              `${name} ${format(label + "|||", ...args).split("|||")[0]}` +
              (testFn.note ? ` (${testFn.note})` : ""),
            defer: true,
            fn: d => {
              const done = () => d.resolve()
              testFn(...args, done)
            },
          },
      )
      .filter(x => x)
  return [
    ...(process.env.NO_FRANCIS ? [] : cases("francis", withFrancis(fn))),
    ...(process.env.NO_BACON ? [] : cases("bacon  ", withBacon(fn))),
    ...(process.env.NO_KEFIR || !fn.kefir ? [] : cases("kefir  ", withKefir(fn.kefir))),
  ]
}

const runTests = (suiteName, testCases) => {
  return new Promise(resolve => {
    console.log(`Running suite ${suiteName}...`)
    console.log("")
    const maxLen = testCases.reduce((m, t) => Math.max(t.description.length, m), 0)
    resetHeapStats()
    testCases
      .reduce(
        (suite, test) => suite.add(test.description.padEnd(maxLen + 1), test),
        new Benchmark.Suite(),
      )
      .on("complete", function() {
        if (MEMORY) {
          const stats = [...heapStats]
          console.log("Memory statistics:")
          console.log(" > Avg mem:", getAvgMemoryUsage(stats))
          console.log(" > Max mem:", getMaxMemoryUsage(stats))
          console.log(" > GC time:", gcTime.toFixed(2), "ms")
        } else {
          this.forEach(test => console.log(test.toString()))
        }
        console.log("")
        resolve()
      })
      .run({ async: true })
  })
}

module.exports = {
  testCases,
  runTests,
}
