const range = n => Array.from(Array(n)).map((_, i) => i)

const times = (n, x) => Array.from(Array(n)).map(() => x)

const subsB = (obs, done) => {
  obs.subscribe(e => e.isEnd && done())
}

const subsK = (obs, done) => {
  obs.observe(_ => {}, _ => {}, done)
}

module.exports = {
  range,
  times,
  subsB,
  subsK,
}
