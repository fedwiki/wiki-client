# The neighborhood provides a cache of site maps read from
# various federated wiki sites. It is careful to fetch maps
# slowly and keeps track of get requests in flight.

_ = require 'underscore'
miniSearch = require 'minisearch'

module.exports = neighborhood = {}

neighborhood.sites = {}
nextAvailableFetch = 0
nextFetchInterval = 500

delay = (ms) ->
  return new Promise((resolve) -> setTimeout(resolve, ms))

populateSiteInfoFor = (site,neighborInfo)->
  return if neighborInfo.sitemapRequestInflight
  neighborInfo.sitemapRequestInflight = true

  transition = (site, from, to) ->
    $(""".neighbor[data-site="#{site}"]""")
      .find('div')
      .removeClass(from)
      .addClass(to)

  boundedDelay = (ms) ->
    minDelay = 60000      # 1 minute
    maxDelay = 43200000   # 12 hours

    if ms > maxDelay
      return maxDelay

    if ms < minDelay
      return minDelay
    
    return ms

  refreshMap = (site, neighborInfo) ->
    neighborInfo.sitemapRequestInflight = true
    sitemapURL = wiki.site(site).getURL('system/sitemap.json')

    if sitemapURL is ''
      transition site, 'fetch', 'fail'
      return

    fetch(sitemapURL)
      .then (response) ->
        neighborInfo.sitemapRequestInflight = false
        if response.ok
          lastModified = Date.parse(response.headers.get('last-modified'))
          if isNaN(lastModified)
            lastModified = 0
          return {
            sitemap: await response.json(),
            lastModified: lastModified
            }
        transition site, 'fetch', 'fail'
        wiki.site(site).refresh () ->
          # empty function
        throw new Error('Unable to fetch sitemap')
      .then (processed) ->
        { sitemap, lastModified } = processed
        if lastModified > neighborInfo.lastModified
          neighborInfo.sitemap = sitemap
          neighborInfo.lastModified = lastModified
          $('body').trigger 'new-neighbor-done', site
          # update the index as well
          refreshIndex(site, neighborInfo)
        updateDelay = boundedDelay(Math.floor((Date.now() - lastModified) / 4 ))
        neighborInfo.nextCheck = Date.now() + updateDelay
        console.log('delay for ', site, (updateDelay / 60000))
        transition site, 'fetch', 'done'
        delay updateDelay
          .then () ->
            transition site, 'done', 'fetch'
            refreshMap site, neighborInfo
        return
      .catch (e) ->
        console.log(site, e)
        transition site, 'fetch', 'fail'
        return

  refreshIndex = (site, neighborInfo) ->
    # we use `wiki.site(site).getIndex` as we want the serialized index as a string.
    wiki.site(site).getIndex 'system/site-index.json', (err, data) ->
      if !err
        try      
          neighborInfo.siteIndex = miniSearch.loadJSON(data, {
            fields: ['title', 'content']
          })
          console.log site, 'index loaded'
        catch error
          console.log 'error loading index - not a valid index', site
      else
        console.log 'error loading index', site, err


  fetchMap = ->
    transition site, 'wait', 'fetch'
    neighborInfo.lastModified = 0
    refreshMap site, neighborInfo

  now = Date.now()
  if now > nextAvailableFetch
    nextAvailableFetch = now + nextFetchInterval
    setTimeout fetchMap, 100
  else
    setTimeout fetchMap, nextAvailableFetch - now
    nextAvailableFetch += nextFetchInterval

neighborhood.retryNeighbor = (site)->
  console.log 'retrying neighbor'
  neighborInfo = {}
  neighborhood.sites[site] = neighborInfo
  populateSiteInfoFor(site, neighborInfo)

neighborhood.registerNeighbor = (site)->
  return if neighborhood.sites[site]?
  neighborInfo = {}
  neighborhood.sites[site] = neighborInfo
  populateSiteInfoFor( site, neighborInfo )
  $('body').trigger 'new-neighbor', site

neighborhood.updateSitemap = (pageObject)->
  site = location.host
  return unless neighborInfo = neighborhood.sites[site]
  return if neighborInfo.sitemapRequestInflight
  slug = pageObject.getSlug()
  date = pageObject.getDate()
  title = pageObject.getTitle()
  synopsis = pageObject.getSynopsis()
  links = pageObject.getLinks()
  entry = {slug, date, title, synopsis, links}
  sitemap = neighborInfo.sitemap
  index = sitemap.findIndex (slot) -> slot.slug == slug
  if index >= 0
    sitemap[index] = entry
  else
    sitemap.push entry
  $('body').trigger 'new-neighbor-done', site

neighborhood.deleteFromSitemap = (pageObject)->
  site = location.host
  return unless neighborInfo = neighborhood.sites[site]
  return if neighborInfo.sitemapRequestInflight
  slug = pageObject.getSlug()
  sitemap = neighborInfo.sitemap
  index = sitemap.findIndex (slot) -> slot.slug == slug
  return unless index >= 0
  sitemap.splice(index)
  $('body').trigger 'delete-neighbor-done', site

neighborhood.listNeighbors = ()->
  _.keys( neighborhood.sites )

# Page Search

extractPageText = (pageText, currentItem) ->
  try
    if currentItem.text?
      switch currentItem.type
        when 'paragraph'
          pageText += ' ' + currentItem.text.replace /\[{2}|\[(?:[\S]+)|\]{1,2}/g, ''
        when 'markdown'
          # really need to extract text from the markdown, but for now just remove link brackets, urls...
          pageText += ' ' + currentItem.text.replace /\[{2}|\[(?:[\S]+)|\]{1,2}|\\n/g, ' '
        when 'html'
          pageText += ' ' + currentItem.text.replace /<[^\>]*>?/g, ''
        else
          if currentItem.text?
            for line in currentItem.text.split /\r\n?|\n/
              pageText += ' ' + line.replace /\[{2}|\[(?:[\S]+)|\]{1,2}/g, '' unless line.match /^[A-Z]+[ ].*/
  catch err
    throw new Error("Error extracting text from #{currentIndex}, #{err}")
  pageText


neighborhood.updateIndex = (pageObject) ->
  console.log "updating #{pageObject.getSlug()} in index"
  site = location.host
  return unless neighborInfo = neighborhood.sites[site]

  slug = pageObject.getSlug()
  title = pageObject.getTitle()
  rawStory = pageObject.getRawPage().story
  newText = rawStory.reduce( extractPageText, '')

  if neighborInfo.siteIndex.has(slug)
    neighborInfo.siteIndex.replace {
      'id': slug
      'title': title
      'content': newText
    }
  else
    neighborInfo.siteIndex.add {
      'id': slug
      'title': title
      'content': newText
    }

neighborhood.deleteFromIndex = (pageObject) ->
  site = location.host
  return unless neighborInfo = neighborhood.sites[site]

  slug = pageObject.getSlug()
  try
    neighborInfo.siteIndex.discard(slug)
  catch err
    # swallow error, if the page was not in index
    console.log "removing #{slug} from index failed", err unless err.message.includes('not in the index')


neighborhood.search = (searchQuery)->
  finds = []
  tally = {}

  tick = (key) ->
    if tally[key]? then tally[key]++ else tally[key] = 1



  indexSite = (site, siteInfo) ->
    timeLabel = "indexing sitemap ( #{site} )"
    console.time timeLabel
    console.log 'indexing sitemap:', site
    siteIndex = new miniSearch({
      fields: ['title', 'content']
    })
    neighborInfo.sitemap.forEach ((page) ->
      siteIndex.add {
        'id': page.slug
        'title': page.title
        'content': page.synopsis
      }
      return
    )
    console.timeEnd timeLabel
    return siteIndex

  start = Date.now()
  # load, or create (from sitemap), site index
  for own neighborSite,neighborInfo of neighborhood.sites
    if neighborInfo.sitemap
      # do we already have an index?
      unless neighborInfo.siteIndex?
        # create an index using sitemap
        neighborInfo.siteIndex = indexSite(neighborSite, neighborInfo)

  origin = location.host
  for own neighborSite,neighborInfo of neighborhood.sites
    if neighborInfo.siteIndex
      tick 'sites'
      try
        if tally['pages']?
          tally['pages'] += neighborInfo.sitemap.length
        else
          tally['pages'] = neighborInfo.sitemap.length
      catch error
        console.info '+++ sitemap not valid for ', neighborSite
        neighborInfo.sitemap = []
      if neighborSite is origin
        titleBoost = 20
        contentBoost = 2
      else
        titleBoost = 10
        contentBoost = 1
      try
        searchResult = neighborInfo.siteIndex.search searchQuery,
          boost:
            title: titleBoost
            content: contentBoost
          prefix: true
          combineWith: 'AND'
      catch error
        console.error('search index error', neighborSite, searchQuery, error)
        searchResult = []
      searchResult.forEach (result) ->
        tick 'finds'
        finds.push
          page: neighborInfo.sitemap.find ({slug}) => slug is result.id
          site: neighborSite
          rank: result.score
  
  # sort the finds by rank
  finds.sort (a,b) ->
    return b.rank - a.rank
  
  tally['msec'] = Date.now() - start
  { finds, tally }

neighborhood.backLinks = (slug) ->

  finds = []

  for own neighborSite, neighborInfo of neighborhood.sites
    if neighborInfo.sitemap
      neighborInfo.sitemap.forEach (sitemapData, pageSlug) ->
        if sitemapData.links? and Object.keys(sitemapData.links).length > 0 and Object.keys(sitemapData.links).includes(slug)
          finds.push
            slug: sitemapData.slug
            title: sitemapData.title
            site: neighborSite
            itemId: sitemapData.links[slug]
            date: sitemapData.date
  results = {}

  finds.forEach (find) ->

    slug = find['slug']

    results[slug] = results[slug] or {}
    results[slug]['title'] = find['title']
    results[slug]['sites'] = results[slug]['sites'] or []
    results[slug]['sites'].push
      site: find['site']
      date: find['date']
      itemId: find['itemId']
  results
    
  