# This module preloads the plugins directory with a few
# plugins that we can't live without. They will be
# browserified along with the rest of the core javascript.
plugin = require './plugin'

window.plugins =
  reference: plugin.wrap('reference', require './reference')
  factory: plugin.wrap('factory', require './factory')
  paragraph: plugin.wrap('paragraph', require './paragraph')
  #image: plugin.wrap('image', require './image')
  future: plugin.wrap('future', require './future')
  importer: plugin.wrap('importer', require './importer')

# mapping between old plugins and their successor
window.pluginSuccessor =
  federatedWiki: 'reference'
  mathjax: 'math'
