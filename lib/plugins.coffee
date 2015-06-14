# This module preloads the plugins directory with a few
# plugins that we can't live without. They will be
# browserified along with the rest of the core javascript.

window.plugins =
  reference: require './reference'
  factory: require './factory'
  paragraph: require './paragraph'
  image: require './image'
  future: require './future'
  importer: require './importer'
