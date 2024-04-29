const fs = require('fs')
const path = require('path')
const yaml = require('yaml')

module.exports = yaml.parse(fs.readFileSync(path.resolve(__dirname, '..', 'usr', 'config.yml'), { encoding: 'utf8' }))
module.exports.base_url_encoded = encodeURIComponent(module.exports.base_url)
