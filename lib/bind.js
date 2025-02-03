// Bind connects the searchbox and the neighbors, both views,
// to the neighborhood, the model that they use. This breaks
// a dependency loop that will probably dissapear when views
// are more event oriented.

// Similarly state depends on injection rather than requiring
// link and thereby breaks another dependency loop.

const neighborhood = require('./neighborhood')
const neighbors = require('./neighbors')
const searchbox = require('./searchbox')

const state = require('./state')
const link = require('./link')

$(function () {
  searchbox.inject(neighborhood)
  searchbox.bind()

  neighbors.inject(neighborhood)
  neighbors.bind()

  if (window.seedNeighbors) {
    window.seedNeighbors.split(',').forEach(site => neighborhood.registerNeighbor(site.trim()))
  }

  state.inject(link)
})
