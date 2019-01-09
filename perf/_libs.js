const { Kefir } = require("kefir")

const kFromArraySync = events =>
  Kefir.stream(emitter => {
    let active = true
    for (let i = 0, n = events.length; active === true && i < n; i++) {
      emitter.emit(events[i])
    }
    if (active === true) {
      emitter.end()
    }
    return () => (active = false)
  })

const kFromArrayAsync = events =>
  Kefir.stream(emitter => {
    let active = true
    process.nextTick(() => {
      for (let i = 0, n = events.length; active === true && i < n; i++) {
        emitter.emit(events[i])
      }
      if (active === true) {
        emitter.end()
      }
    })
    return () => (active = false)
  })

// TODO: built-in or more performant fromArray?
Kefir.fromArray = (events, sync = false) =>
  sync === true ? kFromArraySync(events) : kFromArrayAsync(events)

module.exports = {
  Bacon: require("baconjs/dist/Bacon.min"),
  Francis: require("francis/dist/francis.bacon.min"),
  Kefir,
}
