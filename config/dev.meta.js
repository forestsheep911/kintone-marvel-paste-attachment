const pj = require('../package.json')
const { resolve } = require('path')
module.exports = {
  name: pj.name,
  match: ['https://cndevqpofif.cybozu.cn/k/221/show*'],
  grant: ['GM_getValue', 'GM_setValue', 'GM_addValueChangeListener'],
  require: [`file://${resolve(__dirname, '../dist/dev').replaceAll('\\', '/')}/${pj.name}.script.js`],
}
