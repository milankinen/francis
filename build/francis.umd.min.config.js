import cjs from "rollup-plugin-commonjs"
import buble from "rollup-plugin-buble"
import babel from "rollup-plugin-babel"
import replace from "rollup-plugin-replace"
import { uglify } from "rollup-plugin-uglify"

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
        "(__DEVBUILD__)": "(false)",
        "(__DEVELOPER__)": "(false)",
        "global.__FRANCIS_DEV__": "0",
      },
    }),
    cjs(),
    buble(),
    babel({
      babelrc: false,
      presets: [],
      plugins: ["annotate-pure-calls"],
      exclude: "node_modules/**",
    }),
    uglify({
      compress: true,
      mangle: true,
    }),
  ],
}
