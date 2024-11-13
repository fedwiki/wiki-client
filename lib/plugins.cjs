// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
// This module preloads the plugins directory with a few
// plugins that we can't live without. They will be
// browserified along with the rest of the core javascript.
const plugin = require('./plugin.cjs');

window.plugins = {
  reference: plugin.wrap('reference', require('./reference.cjs')),
  factory: plugin.wrap('factory', require('./factory.cjs')),
  paragraph: plugin.wrap('paragraph', require('./paragraph.cjs')),
  //image: plugin.wrap('image', require './image')
  future: plugin.wrap('future', require('./future.cjs')),
  importer: plugin.wrap('importer', require('./importer.cjs'))
};

// mapping between old plugins and their successor
window.pluginSuccessor = {
  federatedWiki: 'reference',
  mathjax: 'math'
};
