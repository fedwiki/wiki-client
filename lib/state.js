# The state module saves the .page lineup in the browser's location
# bar and history. It also reconstructs that state when the browser
# notifies us that the user has changed this sequence.

active = require './active'
lineup = require './lineup'
link = null

module.exports = state = {}

# FUNCTIONS and HANDLERS to manage location bar and back button

state.inject = (link_) ->
  link = link_

state.pagesInDom = ->
  $.makeArray $(".page").map (_, el) -> el.id

state.urlPages = ->
  (i for i in $(location).attr('pathname').split('/') by 2)[1..]

state.locsInDom = ->
  $.makeArray $(".page").map (_, el) ->
    $(el).data('site') or 'view'

state.urlLocs = ->
  (j for j in $(location).attr('pathname').split('/')[1..] by 2)

state.setUrl = ->
  document.title = lineup.bestTitle()
  if history and history.pushState
    locs = state.locsInDom()
    pages = state.pagesInDom()
    url = ("/#{locs?[idx] or 'view'}/#{page}" for page, idx in pages).join('')
    unless url is $(location).attr('pathname')
      history.pushState(null, null, url)

state.debugStates = () ->
  console.log 'a .page keys ', ($(each).data('key') for each in $('.page'))
  console.log 'a lineup keys', lineup.debugKeys()

state.show = (e) ->
  oldPages = state.pagesInDom()
  newPages = state.urlPages()
  oldLocs = state.locsInDom()
  newLocs = state.urlLocs()

  return if (!location.pathname or location.pathname is '/')

  matching = true
  for name, idx in oldPages
    continue if matching and= name is newPages[idx]
    old = $('.page:last')
    lineup.removeKey old.data('key')
    old.remove()

  matching = true
  for name, idx in newPages
    continue if matching and= name is oldPages[idx]
    # console.log 'push', idx, name
    link.showPage(name, newLocs[idx])

  state.debugStates() if window.debug

  active.set($('.page').last())
  document.title = lineup.bestTitle()

state.first = ->
  state.setUrl()
  firstUrlPages = state.urlPages()
  firstUrlLocs = state.urlLocs()
  oldPages = state.pagesInDom()
  for urlPage, idx in firstUrlPages when urlPage not in oldPages
    link.createPage(urlPage, firstUrlLocs[idx]) unless urlPage is ''

