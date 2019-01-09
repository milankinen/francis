const { Kefir: K } = require("../_libs")
const { range, subsB, subsK } = require("../_util")

const STEP = Math.PI / 5

const oscillate = ticks => {
  const add = (Math.PI / 25) * 0.5
  return ticks.scan(0, s => s + add).map(Math.sin)
}

const branch = (parent, step, ticks, depth) => {
  if (depth === 0) return []
  const width = (parent.width * 3) / 4
  const length = (parent.length * 3) / 4
  const angle = parent.angle.sampledBy(oscillate(ticks), (a, o) => a + step + (o * Math.PI) / 100)
  const coord = parent.coord.sampledBy(angle, ({ x2, y2 }, angle) => ({
    x1: x2,
    y1: y2,
    x2: x2 + Math.cos(angle) * length,
    y2: y2 + -1 * Math.sin(angle) * length,
  }))
  const line = coord.map(c => Object.assign({ width }, c))
  const self = { angle, coord, line, width, length }
  return [line, ...branch(self, STEP, ticks, depth - 1), ...branch(self, -STEP, ticks, depth - 1)]
}

const tree = (B, ticks, depth) => {
  const root = {
    length: 100,
    width: 5,
    angle: B.constant(Math.PI / 2),
    coord: B.constant({ x1: 0, y1: 0, x2: 250, y2: 300 }),
  }
  return B.combineAsArray(branch(root, 0, ticks, depth))
}

const treeTest = (B, depth, done) => {
  const ticks = B.fromArray(range(10))
  subsB(tree(B, ticks, depth), done)
}

treeTest.kefir = (depth, done) => {
  const ticks = K.fromArray(range(10))

  const oscillate = ticks => {
    const add = (Math.PI / 25) * 0.5
    return ticks.scan(s => s + add, 0).map(Math.sin)
  }

  const branch = (parent, step, ticks, depth) => {
    if (depth === 0) return []
    const width = (parent.width * 3) / 4
    const length = (parent.length * 3) / 4
    const angle = parent.angle.sampledBy(oscillate(ticks), (a, o) => a + step + (o * Math.PI) / 100)
    const coord = parent.coord.sampledBy(angle, ({ x2, y2 }, angle) => ({
      x1: x2,
      y1: y2,
      x2: x2 + Math.cos(angle) * length,
      y2: y2 + -1 * Math.sin(angle) * length,
    }))
    const line = coord.map(c => Object.assign({ width }, c))
    const self = { angle, coord, line, width, length }
    return [line, ...branch(self, STEP, ticks, depth - 1), ...branch(self, -STEP, ticks, depth - 1)]
  }

  const root = {
    length: 100,
    width: 5,
    angle: K.constant(Math.PI / 2),
    coord: K.constant({ x1: 0, y1: 0, x2: 250, y2: 300 }),
  }
  const tree = K.combine(branch(root, 0, ticks, depth))
  subsK(tree, done)
}

module.exports = { tree, treeTest }
