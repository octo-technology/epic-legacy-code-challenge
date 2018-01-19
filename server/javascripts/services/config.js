var minimist = require('minimist');

var defaults = {
  name: 'carpaccio'
}
module.exports = Object.assign(defaults, minimist(process.argv))
