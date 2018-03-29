import cjs from "rollup-plugin-commonjs"
import buble from "rollup-plugin-buble"
import closure from "rollup-plugin-closure-compiler-js"
import replace from "rollup-plugin-replace"

export default {
  input: "lib/index.js",
  output: {
    name: "Francis",
    format: "umd",
    file: "dist/francis.min.js",
  },
  plugins: [
    replace({
      delimiters: ["", ""],
      values: {
        "process.env.NODE_ENV": JSON.stringify("production"),
        "process.env.FRANCIS_DEVELOPER": JSON.stringify("0"),
        "(__DEVBUILD__)": "(false)",
        "(__DEVELOPER__)": "(false)",
      },
    }),
    cjs(),
    buble(),
    closure({ processCommonJsModules: false }),
  ],
}
