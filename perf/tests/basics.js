const { Kefir: K } = require("../_libs")
const { range, times, subsB, subsK } = require("../_util")

const inc = x => x + 1

const even = x => x % 2 !== 0

const mapFilter = (B, depth, nEvents, property, done) => {
  const stream = B.fromArray(range(nEvents))
  const result = times(depth, null).reduce(
    s => s.map(inc).filter(even),
    property ? stream.toProperty(-1) : stream,
  )
  subsB(result, done)
}

mapFilter.kefir = (depth, nEvents, property, done) => {
  const stream = K.fromArray(range(nEvents))
  const result = times(depth, null).reduce(
    s => s.map(inc).filter(even),
    property ? stream.toProperty(() => -1) : stream,
  )
  subsK(result, done)
}

const flatMapLatest = (B, nOuter, nInner, done) => {
  const innerEvents = range(nInner).map(i => ({ i }))
  subsB(B.fromArray(range(nOuter)).flatMapLatest(_ => B.fromArray(innerEvents)), done)
}

flatMapLatest.kefir = (nOuter, nInner, done) => {
  const innerEvents = range(nInner).map(i => ({ i }))
  // inner stream must be sync or otherwise it won't emit any events
  // before next outer event unsubscribe the it
  subsK(K.fromArray(range(nOuter)).flatMapLatest(_ => K.fromArray(innerEvents, true)), done)
}

const combineTemplate = (B, nEvents, depth, width, done) => {
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
  subsB(t(depth), done)
}

combineTemplate.kefir = (nEvents, depth, width, done) => {
  const stream = K.fromArray(range(nEvents))
  const t = depth =>
    depth === 0
      ? stream
      : K.combine(range(width).map(_ => t(depth - 1)), (...results) =>
          results.reduce((o, r, i) => Object.assign(o, { [`key${i}`]: r }), {
            const1: "foo",
            const2: "bar",
          }),
        )
  subsK(t(depth), done)
}

const zip = (B, nEvents, width, done) => {
  const stream = B.fromArray(range(nEvents))
  subsB(B.zipAsArray(times(width).map(() => stream.map(x => x))), done)
}

zip.kefir = (nEvents, width, done) => {
  const stream = K.fromArray(range(nEvents))
  subsK(K.zip(times(width).map(() => stream.map(x => x))), done)
}

module.exports = { mapFilter, flatMapLatest, combineTemplate, zip }
