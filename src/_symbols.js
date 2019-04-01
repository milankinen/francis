const hasNative = typeof Symbol === "function"
const S = hasNative ? Symbol : name => `@@${name}`

// global symbols

exports.observable = hasNative
  ? Symbol.observable || (Symbol.observable = Symbol("observable"))
  : S("observable")

// internal symbols

exports.DISPATCHER = S("francis.dispatcher")
exports.HKT = S("francis.hkt")
