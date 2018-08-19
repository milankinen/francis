const { Francis, Bacon } = require("../_libs")
const { tree } = require("../tests/wavingTree")
const { diamond } = require("../tests/diamond")
const { dragDrop } = require("../tests/dragDrop")
require("fpsmeter")

$(document).ready(() => {
  const setTestAndLib = (test, lib) => {
    window.location.hash = test + "|" + lib
    window.location.reload()
  }

  const [test, lib] = (window.location.hash || "").substr(1).split("|")
  if (!test || !lib) {
    setTestAndLib(test || "tree", lib || "francis")
  }

  $("#test")
    .val(test)
    .change(function() {
      setTestAndLib($(this).val(), lib)
    })

  $("#lib")
    .val(lib)
    .change(function() {
      setTestAndLib(test, $(this).val())
    })

  const B = lib === "francis" ? Francis : Bacon
  const fps = new FPSMeter($("#fps")[0], { theme: "light" })

  switch (test) {
    case "tree":
      visualizeTree(B, fps)
      break
    case "diamond":
      visualizeDiamond(B, fps)
      break
    case "dragdrop":
      visualizeDragNDrop(B, fps)
      break
    default:
      break
  }
})

function visualizeTree(B, fps) {
  $("[data-test=tree]").show()
  const canvas = $("#tree-canvas")[0]
  const $depthSel = $("#tree-depth")
  const $depthLbl = $("#tree-depth-label")
  const ctx = canvas.getContext("2d")
  ctx.strokeStyle = "green"

  const render = lines => {
    ctx.clearRect(0, 0, 500, 500)
    for (let line of lines) {
      ctx.beginPath()
      ctx.moveTo(line.x1, line.y1)
      ctx.lineTo(line.x2, line.y2)
      ctx.lineWidth = line.width
      ctx.stroke()
    }
  }

  // start visualization
  B.fromEvent($depthSel[0], "change")
    .map(e => parseInt(e.target.value, 10))
    .toProperty(parseInt($depthSel.val(), 10))
    .doAction(d => $depthLbl.text(d))
    .flatMapLatest(d => tree(B, animationFrameTicks(B), d))
    .onValue(lines => {
      fps.tick()
      render(lines)
    })
}

function visualizeDiamond(B, fps) {
  $("[data-test=diamond]").show()
  const canvas = $("#diamond-canvas")[0]
  const $nLayersSel = $("#diamond-layers")
  const $layersLbl = $("#diamond-layers-label")
  const ctx = canvas.getContext("2d")

  const render = dots => {
    ctx.clearRect(0, 0, 600, 600)
    for (let dot of dots) {
      ctx.beginPath()
      ctx.rect(100 + dot.x, 100 + dot.y, 1, 1)
      ctx.fillStyle = `rgb(0, 0, ${dot.c})`
      ctx.fill()
    }
  }

  // start visualization
  B.fromEvent($nLayersSel[0], "change")
    .map(e => parseInt(e.target.value, 10))
    .toProperty(parseInt($nLayersSel.val(), 10))
    .doAction(n => $layersLbl.text(n))
    .debounce(100)
    .flatMapLatest(n => diamond(B, animationFrameTicks(B), n, 2))
    .onValue(dots => {
      fps.tick()
      render(dots)
    })
}

function visualizeDragNDrop(B, fps) {
  $("[data-test=dragdrop]").show()
  const canvas = $("#dragdrop-canvas")[0]
  const $nDotsSel = $("#dragdrop-n")
  const $nDotsLbl = $("#dragdrop-n-label")
  const ctx = canvas.getContext("2d")
  ctx.strokeStyle = "blue"

  const render = dots => {
    ctx.clearRect(0, 0, 650, 650)
    for (let dot of dots) {
      ctx.beginPath()
      ctx.rect(dot.x, dot.y, 2, 2)
      ctx.fillStyle = `rgb(${dot.color}, 0, 0)`
      ctx.fill()
      if (dot.selected) {
        ctx.stroke()
      }
    }
  }

  const toCoord = e => {
    const { x: cx, y: cy } = canvas.getBoundingClientRect()
    return {
      x: e.clientX - cx,
      y: e.clientY - cy,
    }
  }

  console.log()

  const mouseDown = B.fromEvent(document, "mousedown").map(toCoord)
  const mouseUp = B.fromEvent(document, "mouseup").map(toCoord)
  const mouseMove = B.fromEvent(document, "mousemove").map(toCoord)

  // start visualization
  B.fromEvent($nDotsSel[0], "change")
    .map(e => parseInt(e.target.value, 10))
    .toProperty(parseInt($nDotsSel.val(), 10))
    .map(x => x * x)
    .doAction(n => $nDotsLbl.text(n))
    .debounce(100)
    .flatMapLatest(n => {
      const qn = Math.sqrt(n)
      const dots = Array.from(Array(n)).map((_, i) => ({
        x: 60 + (i % qn) * 10,
        y: 60 + Math.floor(i / qn) * 10,
      }))
      return dragDrop(B, animationFrameTicks(B), mouseDown, mouseMove, mouseUp, dots)
    })
    .onValue(dots => {
      fps.tick()
      render(dots)
    })
}

function animationFrameTicks(B) {
  return B.fromBinder(sink => {
    let run = true
    ;(function loop() {
      if (run) {
        sink(null)
        requestAnimationFrame(loop)
      }
    })()
    return () => (run = false)
  })
}
