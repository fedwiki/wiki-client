// Bind connects the searchbox and the neighbors, both views,
// to the neighborhood, the model that they use. This breaks
// a dependency loop that will probably dissapear when views
// are more event oriented.

// Similarly state depends on injection rather than requiring
// link and thereby breaks another dependency loop.

const neighborhood = require('./neighborhood.cjs');
const neighbors = require('./neighbors.cjs');
const searchbox = require('./searchbox.cjs');

const state = require('./state.cjs');
const link = require('./link.mjs');

$(function() {

  searchbox.inject(neighborhood);
  searchbox.bind();

  neighbors.inject(neighborhood);
  neighbors.bind();

  if (window.seedNeighbors) {
    seedNeighbors.split(',').forEach(site => neighborhood.registerNeighbor(site.trim()));
  }

  state.inject(link);
});
