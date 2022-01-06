# Page provides a factory for pageObjects, a model that combines
# the json derrived object and the site from which it came.


formatDate = require('./util').formatDate
random = require './random'
revision = require './revision'
synopsis = require './synopsis'
_ = require 'underscore'

# http://pragprog.com/magazines/2011-08/decouple-your-apps-with-eventdriven-coffeescript
{EventEmitter} = require 'events'
pageEmitter = new EventEmitter


# TODO: better home for asSlug
asSlug = (name) ->
  name.replace(/\s/g, '-').replace(/[^A-Za-z0-9-]/g, '').toLowerCase()

asTitle = (slug) ->
  slug.replace(/-/g, ' ')

nowSections = (now) ->
  [
    {symbol: '❄', date: now-1000*60*60*24*366, period: 'a Year'}
    {symbol: '⚘', date: now-1000*60*60*24*31*3, period: 'a Season'}
    {symbol: '⚪', date: now-1000*60*60*24*31, period: 'a Month'}
    {symbol: '☽', date: now-1000*60*60*24*7, period: 'a Week'}
    {symbol: '☀', date: now-1000*60*60*24, period: 'a Day'}
    {symbol: '⌚', date: now-1000*60*60, period: 'an Hour'}
  ]

newPage = (json, site) ->
  page = json || {}
  page.title ||= 'empty'
  page.story ||= []
  page.journal ||= []

  getRawPage = ->
    page

  getContext = ->
    context = ['view']
    context.push site if isRemote()
    addContext = (site) -> context.push site if site? and not _.include context, site
    addContext action?.site for action in page.journal.slice(0).reverse()
    context

  isPlugin = ->
    page.plugin?

  isRemote = ->
    ! (site in [undefined, null, 'view', 'origin', 'local', 'recycler'])

  isLocal = ->
    site == 'local'

  isRecycler = ->
    site == 'recycler'

  getRemoteSite = (host = null) ->
    if isRemote() then site else host

  getRemoteSiteDetails = (host = null) ->
    result = []
    result.push(getRemoteSite host) if host or isRemote()
    result.push("#{page.plugin} plugin") if isPlugin()
    result.join "\n"

  getSlug = ->
    asSlug page.title

  getNeighbors = (host) ->
    neighbors = []
    if isRemote()
      neighbors.push site
    else
      neighbors.push host if host?
    for item in page.story
      neighbors.push item.site if item?.site?
    for action in page.journal
      neighbors.push action.site if action?.site?
    _.uniq neighbors

  getTitle = ->
    page.title

  setTitle = (title) ->
    page.title = title

  getRevision = ->
    page.journal.length-1

  getDate = ->
    action = page.journal[getRevision()]
    if action?
      if action.date?
        return action.date
    return undefined

  getTimestamp = ->
    action = page.journal[getRevision()]
    if action?
      if action.date?
        formatDate(action.date)
      else
        "Revision #{getRevision()}"
    else
      "Unrecorded Date"

  getSynopsis = ->
    synopsis page

  getLinks = ->

    extractPageLinks = (collaborativeLinks, currentItem, currentIndex, array) ->
      # extract collaborative links 
      # - this will need extending if we also extract the id of the item containing the link
      try
        linkRe = /\[\[([^\]]+)\]\]/g
        match = undefined
        while (match = linkRe.exec(currentItem.text)) != null
          if not collaborativeLinks.has(asSlug(match[1]))
            collaborativeLinks.set(asSlug(match[1]), currentItem.id)
        if 'reference' == currentItem.type
          if not collaborativeLinks.has(currentItem.slug)
            collaborativeLinks.set(currentItem.slug, currentItem.id)
      catch err
        console.log "*** Error extracting links from #{currentIndex} of #{JSON.stringify(array)}", err.message
      collaborativeLinks

    try
      pageLinksMap = page.story.reduce( extractPageLinks, new Map())
    catch err
      console.log "+++ Extract links on #{page.slug} fails", err
    if pageLinksMap.size > 0
      pageLinks = Object.fromEntries(pageLinksMap)
    else
      pageLinks = {}
    pageLinks


  addItem = (item) ->
    item = _.extend {}, {id: random.itemId()}, item
    page.story.push item

  getItem = (id) ->
    for item in page.story
      return item if item.id is id
    return null

  seqItems = (each) ->
    promise = new Promise (resolve, _reject) ->
      emitItem = (i) ->
        return resolve() if i >= page.story.length
        each page.story[i]||{text:'null'}, -> emitItem i+1
      emitItem 0
    return promise

  addParagraph = (text) ->
    type = "paragraph"
    addItem {type, text}

    # page.journal.push {type: 'add'}

  seqActions = (each) ->
    smaller = 0
    sections = nowSections (new Date).getTime()
    emitAction = (i) ->
      return if i >= page.journal.length
      action = page.journal[i]||{}
      bigger = action.date || 0
      separator = null
      for section in sections
        if section.date > smaller and section.date < bigger
          separator = section
      smaller = bigger
      each {action, separator}, -> emitAction i+1
    emitAction 0

  become = (story, journal) ->
    page.story = story?.getRawPage().story || []
    page.journal = journal?.getRawPage().journal if journal?

  siteLineup = ->
    slug = getSlug()
    path = if slug == 'welcome-visitors'
      "view/welcome-visitors"
    else
      "view/welcome-visitors/view/#{slug}"
    if isRemote()
      # "//#{site}/#{path}"
      wiki.site(site).getDirectURL(path)
    else
      "/#{path}"

  notDuplicate = (journal, action) ->
    for each in journal
      if each.id == action.id and each.date == action.date
        return false
    true

  merge = (update) ->
    merged = (action for action in page.journal)
    for action in update.getRawPage().journal
      merged.push action if notDuplicate(page.journal, action)
    merged.push
      type: 'fork'
      site: update.getRemoteSite()
      date: (new Date()).getTime()
    newPage revision.create(999, {title: page.title, journal: merged}), site

  apply = (action) ->
    revision.apply page, action
    site = null if action.site

  getCreate = () ->
    isCreate = (action) -> action.type == 'create'
    page.journal.reverse().find(isCreate)

  {getRawPage, getContext, isPlugin, isRemote, isLocal, isRecycler, getRemoteSite, getRemoteSiteDetails, getSlug, getNeighbors, getTitle, getLinks, setTitle, getRevision, getDate, getTimestamp, getSynopsis, addItem, getItem, addParagraph, seqItems, seqActions, become, siteLineup, merge, apply, getCreate}

module.exports = {newPage, asSlug, asTitle, pageEmitter}
