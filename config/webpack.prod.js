const { resolve } = require('path')
const webpack = require('webpack')
const banner = require('./common.meta.js')
const { baseOptions, getBanner } = require('./webpack.config.base')

module.exports = () => {
  baseOptions.output.filename = `${banner.name}.js`
  baseOptions.output.path = resolve(__dirname, '../dist/store')
  baseOptions.plugins.push(
    new webpack.BannerPlugin({
      banner: getBanner({}),
      raw: true,
      entryOnly: true,
    }),
    new webpack.DefinePlugin({
      PRODUCTION: true,
    }),
  )
  baseOptions.mode = 'production'
  baseOptions.externals = { uuid: 'uuid' }

  return baseOptions
}
