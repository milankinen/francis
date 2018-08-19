const min = (a, b) => (a < b ? a : b)
const max = (a, b) => (a > b ? a : b)
const inside = ({ x, y }, { x1, y1, x2, y2 }) => x >= x1 && x <= x2 && y >= y1 && y <= y2

const dragDrop = (B, ticks, start, move, stop, dots) => {
  return B.combineAsArray(
    dots.map(({ x, y }, i) => {
      const dot = ticks.scan(0, c => c + i * 0.01).map(c => ({ x, y, color: c % 255 }))
      // note selection could be outside of the loop but we want to measure higher order stream
      // performance so we'll keep it inside
      const selection = start
        .flatMapLatest(start =>
          move
            .map(end => ({
              x1: min(start.x, end.x),
              y1: min(start.y, end.y),
              x2: max(start.x, end.x),
              y2: max(start.y, end.y),
            }))
            .startWith({ x1: start.x, y1: start.y, x2: start.x, y2: start.y })
            .takeUntil(stop),
        )
        .toProperty(null)
      return selection.sampledBy(dot, (s, d) =>
        Object.assign({}, d, {
          selected: s !== null && inside(d, s),
        }),
      )
    }),
  )
}

module.exports = { dragDrop }
