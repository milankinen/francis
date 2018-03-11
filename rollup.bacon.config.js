import cjs from "rollup-plugin-commonjs"
import buble from "rollup-plugin-buble"
import replace from "rollup-plugin-replace"

export default {
  input: "lib/bacon.js",
  output: {
    name: "Francis",
    format: "umd",
    file: "dist/francis.bacon.js",
  },
  plugins: [cjs(), buble(), replace({ "process.env.NODE_ENV": JSON.stringify("development") })],
}
