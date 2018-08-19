const range = n => Array.from(Array(n)).map((_, i) => i)

const times = (n, x) => Array.from(Array(n)).map(() => x)

module.exports = {
  range,
  times,
}
