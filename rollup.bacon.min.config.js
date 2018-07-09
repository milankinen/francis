import cjs from "rollup-plugin-commonjs"
import buble from "rollup-plugin-buble"
import closure from "rollup-plugin-closure-compiler-js"
import replace from "rollup-plugin-replace"

export default {
  input: "lib/bacon.js",
  output: {
    name: "Francis",
    format: "umd",
    file: "dist/francis.bacon.min.js",
  },
  plugins: [
    replace({
      delimiters: ["", ""],
      values: {
        "process.env.NODE_ENV": JSON.stringify("production"),
        "(__DEVBUILD__)": "(false)",
        "(__DEVELOPER__)": "(false)",
      },
    }),
    cjs(),
    buble(),
    closure({ processCommonJsModules: false }),
  ],
}
