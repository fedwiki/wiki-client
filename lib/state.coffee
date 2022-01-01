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

state.fromLocation = (location) ->
  # [{site, slug},...]
  hash = new URLSearchParams(location.hash.substring(1))
  intent = (hash.get("stat") || location.pathname)
    .replace(/^\//,'')
  toSiteSlug = (acc, item, idx) ->
    if idx % 2 == 0
      acc.push({site: item})
    else
      acc[acc.length-1].slug = item
    acc
  parts = intent.split('/')
  if parts.length % 2 == 0
    parts.reduce(toSiteSlug, [])
  else if parts.length == 1 and parts[0].endsWith(".html")
    [{site: "view", slug: parts[0].replace(/\.html$/,'')}]
  else
    [{site: "view", slug: "welcome-visitors"}]

state.fromDOM = () ->
  # [{site, slug},...]
  slugs = state.pagesInDom()
  sites = state.locsInDom()
  slugs.map (slug, idx) ->
    {site: sites[idx], slug: slug}

toURL = (siteSlugs) ->
  combine = (url, item) -> "#{url}/#{item.site}/#{item.slug}"
  intent = siteSlugs.reduce(combine, "")
  url = new URL(location)
  if !!url.hash or url.pathname == '/'
    url.hash = "stat=#{intent.replace(/^\//,'')}"
  else
    url.pathname = intent
  url

unchanged = (url, location) ->
  loc = new URL(location)
  url.pathname == loc.pathname and
    url.search == loc.search and
    url.hash == loc.hash

state.pagesInDom = ->
  $.makeArray $(".page").map (_, el) -> el.id

state.urlPages = ->
  state.fromLocation(location).map((it) -> it.slug)

state.locsInDom = ->
  $.makeArray $(".page").map (_, el) ->
    $(el).data('site') or 'view'

state.urlLocs = ->
  state.fromLocation(location).map((it) -> it.site)

state.setUrl = ->
  document.title = lineup.bestTitle()
  if history and history.pushState
    siteSlugs = state.fromDOM()
    url = toURL(siteSlugs)
    unless unchanged(url, location)
      history.pushState(null, null, url)

state.debugStates = () ->
  console.log 'a .page keys ', ($(each).data('key') for each in $('.page'))
  console.log 'a lineup keys', lineup.debugKeys()

state.show = (e) ->
  oldPages = state.pagesInDom()
  newPages = state.urlPages()
  oldLocs = state.locsInDom()
  newLocs = state.urlLocs()

  return if !location.hash and (!location.pathname or location.pathname is '/')

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
    link.showPage(name, newLocs[idx])

  state.debugStates()

  active.set($('.page').last())
  document.title = lineup.bestTitle()

state.first = ->
  state.setUrl()
  firstUrlPages = state.urlPages()
  firstUrlLocs = state.urlLocs()
  oldPages = state.pagesInDom()
  for urlPage, idx in firstUrlPages when urlPage not in oldPages
    link.createPage(urlPage, firstUrlLocs[idx]) unless urlPage is ''

state.syncDomWithLocation = ->
  main = ""
  for {site, slug} in state.fromLocation(location)
    dataSite = ""
    if site != "view"
      dataSite = """data-site="#{site}" """
    main += """<div id="#{slug}" #{dataSite}class="page"></div>\n"""
  $('section.main').html(main)
