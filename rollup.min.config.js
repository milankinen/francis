import cjs from 'rollup-plugin-commonjs'
import buble from 'rollup-plugin-buble'
import closure from 'rollup-plugin-closure-compiler-js'
import replace from 'rollup-plugin-replace'

export default {
  entry: 'lib/index.js',
  format: 'umd',
  moduleName: 'Francis',
  plugins: [
    cjs(),
    buble(),
    replace({'process.env.NODE_ENV': JSON.stringify('production')}),
    closure({processCommonJsModules: false})
  ],
  dest: 'dist/francis.min.js'
};