import cjs from 'rollup-plugin-commonjs'
import buble from 'rollup-plugin-buble'

export default {
  entry: 'lib/index.js',
  format: 'umd',
  moduleName: 'Francis',
  plugins: [
    cjs(),
    buble()
  ],
  dest: 'dist/francis.js'
};