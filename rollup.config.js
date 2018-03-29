import cjs from "rollup-plugin-commonjs"
import buble from "rollup-plugin-buble"
import replace from "rollup-plugin-replace"

export default {
  input: "lib/index.js",
  output: {
    name: "Francis",
    format: "umd",
    file: "dist/francis.js",
  },
  plugins: [
    replace({
      delimiters: ["", ""],
      values: {
        "process.env.NODE_ENV": JSON.stringify("development"),
        "process.env.FRANCIS_DEVELOPER": JSON.stringify("0"),
        "(__DEVBUILD__)": "(true)",
        "(__DEVELOPER__)": "(false)",
      },
    }),
    cjs(),
    buble(),
  ],
}
