
module.exports = security = {}

# make use of plugin getScript to load the security plugin's client code
plugin = require './plugin'

module.exports = (user) ->

  plugin.getScript "/security/security.js", () ->
    window.plugins.security.setup(user)
