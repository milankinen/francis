const memwatch = require("@airbnb/node-memwatch")
const Benchmark = require("benchmark")
const bytes = require("pretty-bytes")
const { format } = require("util")
const { Francis, Bacon } = require("./_libs")

const MEMORY = !!process.env.SHOW_MEMORY_USAGE
let heapStats = []
let gcTime = 0

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
  const cases = (name, B) =>
    combinations.map(args => ({
      description: `${name} ${format(label + "|||", ...args).split("|||")[0]}`,
      defer: true,
      fn: d => fn(B, ...args).subscribe(e => e.isEnd && d.resolve()),
    }))
  return [
    ...(process.env.NO_FRANCIS ? [] : cases("francis", Francis)),
    ...(process.env.NO_BACON ? [] : cases("bacon  ", Bacon)),
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
