import cjs from "rollup-plugin-commonjs"
import buble from "rollup-plugin-buble"
import closure from "rollup-plugin-closure-compiler-js"
import replace from "rollup-plugin-replace"

export default {
  input: "lib/index.js",
  output: {
    name: "Francis",
    format: "umd",
    file: "dist/francis.min.js"
  },
  plugins: [
    cjs(),
    buble(),
    replace({"process.env.NODE_ENV": JSON.stringify("production")}),
    closure({processCommonJsModules: false})
  ]
};