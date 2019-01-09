const { testCases, runTests } = require("./_base")
const { mapFilter, flatMapLatest, combineTemplate, zip } = require("./tests/basics")
const { diamondTest } = require("./tests/diamond")
const { treeTest } = require("./tests/wavingTree")

const all = [
  {
    key: "mapfilter",
    cases: testCases("stream.map().filter() x %d (%d events)", mapFilter, [
      [1, 1000, false],
      [100, 1000, false],
    ]),
  },
  {
    key: "pmapfilter",
    cases: testCases("property.map().filter() x %d (%d events)", mapFilter, [
      [1, 1000, true],
      [100, 1000, true],
    ]),
  },
  {
    key: "flatmaplatest",
    cases: testCases("stream.flatMapLatest() (%d x %d events)", flatMapLatest, [
      [10, 1000],
      [1000, 10],
    ]),
  },
  {
    key: "combinetemplate",
    cases: testCases(
      "combineTemplate(...width) x depth (%d events, depth = %d, width = %d)",
      combineTemplate,
      [[1000, 6, 2], [1000, 2, 6]],
    ),
  },
  {
    key: "zip",
    cases: testCases("zipAsArray(...width) (%d events, width = %d)", zip, [[1000, 5], [1000, 50]]),
  },
  {
    key: "diamond",
    cases: testCases("diamond x %d layers", diamondTest, [[2], [5], [10], [20]]),
  },
  {
    key: "tree",
    cases: testCases("tree x %d depth", treeTest, [[3], [10]]),
  },
]

const filters = new Set(process.argv.slice(2))
const picked = filters.size === 0 ? all : all.filter(({ key }) => filters.has(key))
if (picked.length === 0) {
  console.log("No tests selected")
  process.exit(1)
}

;(function run(tests) {
  if (tests.length === 0) {
    console.log("Done")
  } else {
    const [{ key, cases }, ...rest] = tests
    runTests(key, cases).then(() => run(rest))
  }
})(picked)
