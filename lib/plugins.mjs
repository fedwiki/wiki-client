// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
// This module preloads the plugins directory with a few
// plugins that we can't live without. They will be
// browserified along with the rest of the core javascript.
import * as plugin from './plugin.mjs';

window.plugins = {
  reference: plugin.wrap('reference', require('./reference.mjs')),
  factory: plugin.wrap('factory', require('./factory.mjs')),
  paragraph: plugin.wrap('paragraph', require('./paragraph.mjs')),
  //image: plugin.wrap('image', require './image')
  future: plugin.wrap('future', require('./future.mjs')),
  importer: plugin.wrap('importer', require('./importer.mjs'))
};

// mapping between old plugins and their successor
window.pluginSuccessor = {
  federatedWiki: 'reference',
  mathjax: 'math'
};
