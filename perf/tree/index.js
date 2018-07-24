const B = require("../../dist/francis.bacon")
//const B = require("baconjs/dist/Bacon.min")
require("fpsmeter")

const STEP = Math.PI / 5

//const randomized = (x, a) => x * (Math.random() * a * 2 + 1 - a)
const randomized = (x, a) => x

const oscillate = ticks => {
  const add = (Math.PI / 25) * 0.5
  return ticks.scan(0, s => s + add).map(Math.sin)
}

const branch = (parent, step, ticks, depth) => {
  if (depth === 0) return []
  const width = randomized((parent.width * 3) / 4, 0.1)
  const length = randomized((parent.length * 3) / 4, 0.1)
  const angle = parent.angle.sampledBy(oscillate(ticks), (a, o) => a + step + (o * Math.PI) / 100)
  const coord = parent.coord.sampledBy(angle, ({ x2, y2 }, angle) => ({
    x1: x2,
    y1: y2,
    x2: x2 + Math.cos(angle) * length,
    y2: y2 + -1 * Math.sin(angle) * length,
  }))
  const line = coord.map(c => Object.assign({ width }, c))
  const self = { angle, coord, line, width, length }
  return [
    line,
    ...branch(self, randomized(STEP, 0.4), ticks, depth - 1),
    ...branch(self, randomized(-STEP, 0.4), ticks, depth - 1),
  ]
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

const visualize = (B, elem) => {
  let lines = []
  const depthSel = document.getElementById("depth")
  const depthLbl = document.getElementById("depth-label")
  const fps = new FPSMeter({ theme: "light" })
  const ctx = elem.getContext("2d")

  ctx.strokeStyle = "green"
  ;(function render() {
    if (lines === null) return
    fps.tick()
    ctx.clearRect(0, 0, 500, 300)
    for (let line of lines) {
      ctx.beginPath()
      ctx.moveTo(line.x1, line.y1)
      ctx.lineTo(line.x2, line.y2)
      ctx.lineWidth = line.width
      ctx.stroke()
    }
    requestAnimationFrame(render)
  })()
  // start calculation
  B.fromEvent(depthSel, "change")
    .map(e => parseInt(e.target.value, 10))
    .toProperty(parseInt(depthSel.value, 10))
    .doAction(d => (depthLbl.textContent = d))
    .flatMapLatest(d => tree(B, B.interval(16), d))
    .onValue(updated => {
      lines = updated
    })
}

visualize(B, document.getElementById("tree"))
