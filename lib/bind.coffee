neighborhood = require './neighborhood'
neighbors = require './neighbors'
searchbox = require './searchbox'

state = require './state'
link = require './link'

$ ->

  searchbox.inject neighborhood
  searchbox.bind()

  neighbors.inject neighborhood
  neighbors.bind()

  state.inject link