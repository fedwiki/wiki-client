wiki = require './wiki'
active = require './active'
lineup = require './lineup'

module.exports = state = {}

# FUNCTIONS and HANDLERS to manage location bar and back button

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
  document.title = $('.page:last').data('data')?.title
  if history and history.pushState
    locs = state.locsInDom()
    pages = state.pagesInDom()
    url = ("/#{locs?[idx] or 'view'}/#{page}" for page, idx in pages).join('')
    unless url is $(location).attr('pathname')
      history.pushState(null, null, url)

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
    console.log 'push', idx, name
    #NEWPAGE (not) state.show, wiki.createPage, wiki.refresh
    wiki.createPage(name, newLocs[idx]).appendTo($('.main')).each wiki.refresh.refresh

  console.log 'a .page keys ', ($(each).data('key') for each in $('.page'))
  console.log 'a lineup keys', lineup.debugKeys()

  active.set($('.page').last())
  document.title = $('.page:last').data('data')?.title

state.first = ->
  state.setUrl()
  firstUrlPages = state.urlPages()
  firstUrlLocs = state.urlLocs()
  oldPages = state.pagesInDom()
  for urlPage, idx in firstUrlPages when urlPage not in oldPages
    #NEWPAGE (not) state.first, wiki.createPage
    wiki.createPage(urlPage, firstUrlLocs[idx]).appendTo('.main') unless urlPage is ''

