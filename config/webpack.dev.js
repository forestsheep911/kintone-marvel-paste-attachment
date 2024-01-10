const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { baseOptions, getBanner } = require('./webpack.config.base')
const devBanner = require('./dev.meta.js')
const fs = require('fs')
const outputPath = path.resolve(__dirname, '../dist/dev')
const monkeyHeader = `${devBanner.name}.header.js`

function ensureDirectoryExistence(filePath) {
  var dirname = path.dirname(filePath)
  console.log(filePath)
  console.log(dirname)
  if (fs.existsSync(dirname)) {
    return true
  }
  ensureDirectoryExistence(dirname)
  fs.mkdirSync(dirname)
}
ensureDirectoryExistence(`${outputPath}/dummy`)
fs.writeFile(path.join(outputPath, monkeyHeader), getBanner(devBanner), () => {})

module.exports = () => {
  baseOptions.output.path = outputPath
  baseOptions.output.filename = `${devBanner.name}.script.js`
  baseOptions.plugins.push(
    new webpack.BannerPlugin({
      banner: getBanner(devBanner),
      raw: true,
      entryOnly: true,
    }),
    new webpack.DefinePlugin({
      PRODUCTION: false,
      FILENAME: JSON.stringify(`${devBanner.name}.script.js`),
    }),
    // new HtmlWebpackPlugin({
    //   template: './public/index.html',
    //   inject: 'body',
    // }),
  )
  baseOptions.devServer = {
    static: [
      {
        directory: path.join(__dirname, '../public'),
      },
      {
        directory: path.join(__dirname, '../dist'),
      },
    ],
    compress: true,
    port: 8080,
    hot: false,
    open: true,
    liveReload: true,
    watchFiles: ['src/**/*', 'public/**/*'],
  }
  baseOptions.mode = 'development'
  baseOptions.externals = { '@kintone/rest-api-client': 'KintoneRestAPIClient' }

  return baseOptions
}
