# The neighborhood provides a cache of site maps read from
# various federated wiki sites. It is careful to fetch maps
# slowly and keeps track of get requests in flight.

_ = require 'underscore'

module.exports = neighborhood = {}

neighborhood.sites = {}
nextAvailableFetch = 0
nextFetchInterval = 2000

populateSiteInfoFor = (site,neighborInfo)->
  return if neighborInfo.sitemapRequestInflight
  neighborInfo.sitemapRequestInflight = true

  transition = (site, from, to) ->
    $(""".neighbor[data-site="#{site}"]""")
      .find('div')
      .removeClass(from)
      .addClass(to)

  fetchMap = ->
    sitemapUrl = "http://#{site}/system/sitemap.json"
    transition site, 'wait', 'fetch'
    request = $.ajax
      type: 'GET'
      dataType: 'json'
      url: sitemapUrl
    request
      .always( -> neighborInfo.sitemapRequestInflight = false )
      .done (data)->
        neighborInfo.sitemap = data
        transition site, 'fetch', 'done'
        $('body').trigger 'new-neighbor-done', site
      .fail (data)->
        transition site, 'fetch', 'fail'

  now = Date.now()
  if now > nextAvailableFetch
    nextAvailableFetch = now + nextFetchInterval
    setTimeout fetchMap, 100
  else
    setTimeout fetchMap, nextAvailableFetch - now
    nextAvailableFetch += nextFetchInterval


neighborhood.registerNeighbor = (site)->
  return if neighborhood.sites[site]?
  neighborInfo = {}
  neighborhood.sites[site] = neighborInfo
  populateSiteInfoFor( site, neighborInfo )
  $('body').trigger 'new-neighbor', site

neighborhood.listNeighbors = ()->
  _.keys( neighborhood.sites )

neighborhood.search = (searchQuery)->
  finds = []
  tally = {}

  tick = (key) ->
    if tally[key]? then tally[key]++ else tally[key] = 1

  match = (key, text) ->
    hit = text? and text.toLowerCase().indexOf( searchQuery.toLowerCase() ) >= 0
    tick key if hit
    hit

  start = Date.now()
  for own neighborSite,neighborInfo of neighborhood.sites
    sitemap = neighborInfo.sitemap
    tick 'sites' if sitemap?
    matchingPages = _.each sitemap, (page)->
      tick 'pages'
      return unless match('title', page.title) or match('text', page.synopsis) or match('slug', page.slug)
      tick 'finds'
      finds.push
        page: page,
        site: neighborSite,
        rank: 1 # HARDCODED FOR NOW
  tally['msec'] = Date.now() - start
  { finds, tally }

