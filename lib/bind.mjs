// Bind connects the searchbox and the neighbors, both views,
// to the neighborhood, the model that they use. This breaks
// a dependency loop that will probably dissapear when views
// are more event oriented.

// Similarly state depends on injection rather than requiring
// link and thereby breaks another dependency loop.

import { Neighborhood } from './neighborhood.mjs';
const neighborhood = new Neighborhood();

import * as neighbors from './neighbors.mjs';
import * as searchbox from './searchbox.mjs';
import * as state from './state.mjs';
import * as link from './link.mjs';

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
