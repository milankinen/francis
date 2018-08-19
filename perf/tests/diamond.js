const diamond = (B, ticks, layers, margin) => {
  const layer = (srcs, y) => {
    const nodes = []
    for (let i = 0, n = srcs.length - 1; i < n; i++) {
      nodes.push(
        B.combineWith(srcs[i], srcs[i + 1], (l, r) => ({
          x: (l.x + r.x) / 2,
          y: y + margin,
          c: (l.c + r.c) / 2,
        })),
      )
    }
    return nodes.length === 1 ? nodes : [...nodes, ...layer(nodes, y + margin)]
  }
  const roots = Array.from(Array(layers)).map((_, i) =>
    ticks.scan(0, x => x + i * 0.1).map(c => ({ x: i * margin, y: 0, c: c % 255 })),
  )
  return B.combineAsArray([...roots, ...layer(roots, 0)])
}

module.exports = { diamond }
