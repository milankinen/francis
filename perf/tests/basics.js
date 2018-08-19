const { range, times } = require("../_util")

const inc = x => x + 1

const even = x => x % 2 !== 0

const mapFilter = (B, depth, nEvents, property) => {
  const stream = B.fromArray(range(nEvents))
  return times(depth, null).reduce(
    s => s.map(inc).filter(even),
    property ? stream.toProperty(-1) : stream,
  )
}

const flatMapLatest = (B, nOuter, nInner) => {
  const innerEvents = range(nInner).map(i => ({ i }))
  return B.fromArray(range(nOuter)).flatMapLatest(_ => B.fromArray(innerEvents))
}

const combineTemplate = (B, nEvents, depth, width) => {
  const stream = B.fromArray(range(nEvents))
  const t = depth =>
    depth === 0
      ? stream
      : B.combineTemplate(
          range(width).reduce((o, i) => Object.assign(o, { [`key${i}`]: t(depth - 1) }), {
            const1: "foo",
            const2: "bar",
          }),
        )
  return t(depth)
}

const zip = (B, nEvents, width) => {
  const stream = B.fromArray(range(nEvents))
  return B.zipAsArray(times(width).map(() => stream.map(x => x)))
}

module.exports = { mapFilter, flatMapLatest, combineTemplate, zip }
