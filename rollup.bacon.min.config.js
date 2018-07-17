import cjs from "rollup-plugin-commonjs"
import buble from "rollup-plugin-buble"
import replace from "rollup-plugin-replace"
import { uglify } from "rollup-plugin-uglify"

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
        "global.__FRANCIS_DEV__": "0",
      },
    }),
    cjs(),
    buble(),
    uglify({
      compress: true,
      mangle: true,
    }),
  ],
}
