/*
 * Uses of plugin getScript to load the security plugin's client code
 */

let security
module.exports = security = {}

const plugin = require('./plugin')

module.exports = user => plugin.getScript('/security/security.js', () => window.plugins.security.setup(user))
