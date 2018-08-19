const info = require("systeminformation")
const bytes = require("pretty-bytes")

// ...
;(async function main() {
  const { manufacturer, brand, speed, cores } = await info.cpu()
  const { total, available } = await info.mem()
  console.log("System information:")
  console.log(` > CPU: ${manufacturer} ${brand}, ${speed} GHz, ${cores} cores`)
  console.log(` > Memory: ${bytes(total)} total, ${bytes(available)} available`)
})()
