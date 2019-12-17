import nodeResolve from 'rollup-plugin-node-resolve';

export default {
  input: 'dist/esm/index.js',
  output: {
    file: 'dist/ionic-enterprise-couchbase-lite.js',
    format: 'cjs'
  },
  sourcemap: true,
  banner: '/*! Ionic Couchbase Lite 2.x Integration : https://ionicframework.com/ - Commercially Licensed */',
  plugins: [
    nodeResolve()
  ]
};

