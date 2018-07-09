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
  plugins: [
    replace({
      delimiters: ["", ""],
      values: {
        "process.env.NODE_ENV": JSON.stringify("development"),
        "(__DEVBUILD__)": "(true)",
        "(__DEVELOPER__)": "(false)",
      },
    }),
    cjs(),
    buble(),
  ],
}
