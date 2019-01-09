const range = n => Array.from(Array(n)).map((_, i) => i)

const times = (n, x) => Array.from(Array(n)).map(() => x)

const subsB = (obs, done) => {
  return obs.subscribe(e => e.isEnd && done())
}

const subsK = (obs, done) => {
  const subs = obs.observe(_ => {}, _ => {}, done)
  return () => subs.unsubscribe()
}

module.exports = {
  range,
  times,
  subsB,
  subsK,
}
