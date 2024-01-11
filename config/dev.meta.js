const pj = require('../package.json')
const { resolve } = require('path')
module.exports = {
  name: pj.name,
  match: ['https://cndevqpofif.cybozu.cn/k/221/show*'],
  grant: ['GM_getValue', 'GM_setValue', 'GM_addValueChangeListener'],
  require: [
    'https://unpkg.com/@kintone/rest-api-client@latest/umd/KintoneRestAPIClient.js',
    'https://cdnjs.cloudflare.com/ajax/libs/uuid/8.3.2/uuidv4.min.js',
    `file://${resolve(__dirname, '../dist/dev').replaceAll('\\', '/')}/${pj.name}.script.js`,
  ],
}
