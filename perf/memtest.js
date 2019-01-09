const { execSync } = require("child_process")
const memwatch = require("@airbnb/node-memwatch")
const { times, subsB, subsK } = require("./_util")

const wait = t => new Promise(resolve => setTimeout(resolve, t))

const formatDiff = (desc, diff) => ` > ${desc}: ${diff.after.size}`

const diff = async (desc, block) => {
  global.gc()
  const hd = new memwatch.HeapDiff()
  const res = await block()
  global.gc()
  const diff = hd.end()
  console.log(formatDiff(desc, diff))
  return res
}

const setBaseline = async () => {
  await diff("Baseline", async () => {})
}

const loadFrancis = async () => {
  return await diff("Library loaded", () => {
    return require("francis/dist/francis.bacon.min")
  })
}

const loadBacon = async () => {
  return await diff("Library loaded", () => {
    return require("baconjs/dist/Bacon.min")
  })
}

const loadKefir = async () => {
  return await diff("Library loaded", () => {
    return require("kefir")
  })
}

const testGraph = async (buildGraph, subs) => {
  const [graph, nextTick] = await diff("Graph built", async () => {
    return buildGraph()
  })
  const dispose = await diff("Graph activated", async () => {
    const d = subs(graph, () => {})
    await wait(100)
    return d
  })
  await diff("After 1 tick", async () => {
    nextTick()
  })
  await diff("After 10 tick", async () => {
    for (let i = 1; i < 10; i++) {
      nextTick()
    }
  })
  await diff("After dispose", async () => {
    dispose()
  })
}

const makeTicks = F => {
  const ticks = new F.Bus()
  const nextTick = () => ticks.push(0)
  return [ticks, nextTick]
}

const makeKefirTicks = K => {
  let emitter = null
  const ticks = K.stream(e => (emitter = e))
  const nextTick = () => emitter && emitter.emit(0)
  return [ticks, nextTick]
}

const testDiamond = async (name, layers, loadLib) => {
  console.log(`${name} Diamond memory test with ${layers} layers`)
  const { diamond } = require("./tests/diamond")
  await setBaseline()
  const F = await loadLib()
  const buildGraph = () => {
    const [ticks, nextTick] = makeTicks(F)
    return [diamond(F, ticks, layers, 10), nextTick]
  }
  await testGraph(buildGraph, subsB)
}

const testMapFilter = async (name, n, useProperty, loadLib) => {
  console.log(
    `${name} ${n} x .map().filter() memory test with ` + (useProperty ? "Property" : "EventStream"),
  )
  await setBaseline()
  const F = await loadLib()
  const buildGraph = () => {
    const [ticks, nextTick] = makeTicks(F)
    const inc = x => x + 1
    const alwaysTrue = _ => true
    const source = useProperty ? ticks.toProperty(0) : ticks
    const graph = times(n).reduce(s => s.map(inc).filter(alwaysTrue), source)
    return [graph, nextTick]
  }
  await testGraph(buildGraph, subsB)
}

const testKefirMapFilter = async (n, useProperty) => {
  console.log(
    `Kefir ${n} x .map().filter() memory test with ` + (useProperty ? "Property" : "EventStream"),
  )
  await setBaseline()
  const K = await loadKefir()
  const buildGraph = () => {
    const [ticks, nextTick] = makeKefirTicks(K)
    const inc = x => x + 1
    const alwaysTrue = _ => true
    const source = useProperty ? ticks.toProperty(() => 0) : ticks
    const graph = times(n).reduce(s => s.map(inc).filter(alwaysTrue), source)
    return [graph, nextTick]
  }
  await testGraph(buildGraph, subsK)
}

const testFrancisDiamond = async layers => {
  await testDiamond("Francis", layers, loadFrancis)
}

const testBaconDiamond = async layers => {
  await testDiamond("Bacon", layers, loadBacon)
}

const testFrancisMapFilter = async (n, useProperty) => {
  await testMapFilter("Francis", n, useProperty, loadFrancis)
}

const testBaconMapFilter = async (n, useProperty) => {
  await testMapFilter("Bacon", n, useProperty, loadBacon)
}

const test = (f, argCombinations) => ({ f, c: argCombinations })

const tests = {
  "francis:diamond": test(testFrancisDiamond, [[10], [50]]),
  "bacon:diamond": test(testBaconDiamond, [[10], [50]]),
  "francis:mapfilter": test(testFrancisMapFilter, [[1000, 0], [1000, 1]]),
  "bacon:mapfilter": test(testBaconMapFilter, [[1000, 0], [1000, 1]]),
  "kefir:mapfilter": test(testKefirMapFilter, [[1000, 0], [1000, 1]]),
}

const [__, ___, testToRun, ...args] = process.argv
if (testToRun) {
  const test = tests[testToRun]
  if (!test) {
    console.log("No test found")
    process.exit(1)
  }
  const testFn = test.f
  if (testFn.length !== args.length) {
    console.log(`Wrong number of test args, ${testFn.length} expected`)
    process.exit(1)
  }
  testFn(...args.map(a => parseInt(a)))
} else {
  const keys = Object.keys(tests).sort()
  keys.forEach(key => {
    const { c: argCombinations } = tests[key]
    argCombinations.forEach(combination => {
      console.log(
        execSync(
          `node -stack-size=4096 --expose_gc memtest.js ${key} ${combination
            .map(c => c.toString())
            .join(" ")}`,
        ).toString(),
      )
    })
  })
}
