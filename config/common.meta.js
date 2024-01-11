const pj = require('../package.json')
module.exports = {
  name: pj.name,
  namespace: pj.homepage,
  version: pj.version,
  description: pj.description,
  author: pj.author,
  copyright: pj.author,
  license: pj.license,
  match: [
    'https://*.cybozu.cn/k/*/show*',
    'https://*.cybozu.com/k/*/show*',
    'https://*.cybozu-dev.com/k/*/show*',
    'https://*.kintone.com/k/*/show*',
    'https://*.s.cybozu.cn/k/*/show*',
    'https://*.s.cybozu.com/k/*/show*',
    'https://*.s.kintone.com/k/*/show*',
  ],
  require: [
    'hhttps://unpkg.com/@kintone/rest-api-client@latest/umd/KintoneRestAPIClient.js',
    'https://cdnjs.cloudflare.com/ajax/libs/uuid/8.3.2/uuidv4.min.js',
  ],
  'run-at': 'document-end',
  supportURL: pj.bugs.url,
  homepage: pj.homepage,
  grant: [],
  icon: 'https://img.icons8.com/dusk/64/picture.png',
}
