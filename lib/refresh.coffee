# Refresh will fetch a page and use it to fill a dom
# element that has been ready made to hold it.
#
# cycle: have a div, $(this), with id = slug
# whenGotten: have a pageObject we just fetched
# buildPage: have a pageObject from somewhere
# rebuildPage: have a key from saving pageObject in lineup
# renderPageIntoPageElement: have $page annotated from pageObject
# pageObject.seqItems: get back each item sequentially
# plugin.do: have $item in dom for item
#
# The various calling conventions are due to async
# requirements and the work of many hands.

_ = require 'underscore'

pageHandler = require './pageHandler'
plugin = require './plugin'
state = require './state'
neighborhood = require './neighborhood'
addToJournal = require './addToJournal'
actionSymbols = require './actionSymbols'
lineup = require './lineup'
resolve = require './resolve'
random = require './random'

pageModule = require('./page')
newPage = pageModule.newPage
asSlug = pageModule.asSlug
pageEmitter = pageModule.pageEmitter


getItem = ($item) ->
  $($item).data("item") or $($item).data('staticItem') if $($item).length > 0

aliasItem = ($page, $item, oldItem) ->
  item = $.extend {}, oldItem
  pageObject = lineup.atKey($page.data('key'))
  if pageObject.getItem(item.id)?
    item.alias ||= item.id
    item.id = random.itemId()
    $item.attr 'data-id', item.id
  else if item.alias?
    unless pageObject.getItem(item.alias)?
      item.id = item.alias
      delete item.alias
      $item.attr 'data-id', item.id
  item

handleDragging = (evt, ui) ->
  $item = ui.item

  item = getItem($item)
  $thisPage = $(this).parents('.page:first')
  $sourcePage = $item.data('pageElement')
  sourceSite = $sourcePage.data('site')

  $destinationPage = $item.parents('.page:first')
  equals = (a, b) -> a and b and a.get(0) == b.get(0)

  moveWithinPage = not $sourcePage or equals($sourcePage, $destinationPage)
  moveFromPage = not moveWithinPage and equals($thisPage, $sourcePage)
  moveToPage = not moveWithinPage and equals($thisPage, $destinationPage)

  # If making a copy, update the temp clone so it becomes a true copy.
  if ui.item.hasClass('copy')
    $('.shadow-copy').removeClass('shadow-copy')
      .data(ui.item.data()).attr({'data-id': ui.item.attr('data-id')})

  if moveFromPage
    if $sourcePage.hasClass('ghost') or
      $sourcePage.attr('id') == $destinationPage.attr('id') or
        evt.shiftKey
          # stem the damage, better ideas here:
          # http://stackoverflow.com/questions/3916089/jquery-ui-sortables-connect-lists-copy-items
          return

  action = if moveWithinPage
    order = $(this).children().map((_, value) -> $(value).attr('data-id')).get()
    {type: 'move', order: order}
  else if moveFromPage
    console.log 'drag from', $sourcePage.find('h1').text()
    {type: 'remove'}
  else if moveToPage
    $item.data 'pageElement', $thisPage
    $before = $item.prev('.item')
    before = getItem($before)
    item = aliasItem $thisPage, $item, item
    {type: 'add', item, after: before?.id}
  action.id = item.id
  pageHandler.put $thisPage, action

changeMouseCursor = (e, ui) ->
  if e.shiftKey and ui.item.hasClass('copy-capable')
    $('body').css('cursor', 'copy')
    $('.shadow-copy').show()
    ui.item.addClass('copy')
  else
    $('body').css('cursor', 'move')
    $('.shadow-copy').hide()
    ui.item.removeClass('copy')

initDragging = ($page) ->
  origCursor = $('body').css('cursor')
  options =
    connectWith: '.page .story'
    placeholder: 'item-placeholder'
    forcePlaceholderSize: true
  $story = $page.find('.story')
  $story.sortable(options)
    .on 'sortupdate', handleDragging
    .on 'sort', changeMouseCursor
    .on 'sortstart', (e, ui) ->
      # Create a copy that we control since sortable removes theirs too early.
      # Insert after the placeholder to prevent adding history when item not moved.
      # Clear out the styling they add. Updates to jquery ui can affect this.
      ui.item.clone().insertAfter(ui.placeholder).hide().addClass("shadow-copy")
        .css(
          width: ''
          height: ''
          position: ''
          zIndex: ''
        ).removeAttr('data-id')
    .on 'sortover', (e, ui) ->
      if ui.sender and ui.sender[0] != e.target
        ui.item.addClass('copy-capable')
      else
        ui.item.removeClass('copy-capable')
    .on 'sortstop', (e, ui) ->
      $('body').css('cursor', origCursor)
      $('.shadow-copy').remove()

getPageObject = ($journal) ->
  $page = $($journal).parents('.page:first')
  lineup.atKey $page.data('key')

handleMerging = (event, ui) ->
  drag = getPageObject ui.draggable
  drop = getPageObject event.target
  pageEmitter.emit 'show', drop.merge drag

initMerging = ($page) ->
  $journal = $page.find('.journal')
  $journal.draggable
    revert: true
    appendTo: '.main'
    scroll: false
    helper: 'clone'
  $journal.droppable
    hoverClass: "ui-state-hover"
    drop: handleMerging

initAddButton = ($page) ->
  $page.find(".add-factory").on("click", (evt) ->
    return if $page.hasClass 'ghost'
    evt.preventDefault()
    createFactory($page))

createFactory = ($page) ->
  item =
    type: "factory"
    id: random.itemId()
  $item = $("<div />", class: "item factory").data('item',item).attr('data-id', item.id)
  $item.data 'pageElement', $page
  $page.find(".story").append($item)
  plugin.do $item, item
  $before = $item.prev('.item')
  before = getItem($before)
  pageHandler.put $page, {item: item, id: item.id, type: "add", after: before?.id}

handleHeaderClick = (e) ->
    e.preventDefault()
    lineup.debugSelfCheck ($(each).data('key') for each in $('.page'))
    $page = $(e.target).parents('.page:first')
    crumbs = lineup.crumbs $page.data('key'), location.host
    [target, ] = crumbs
    [prefix, ] = wiki.site(target).getDirectURL('').split('/')
    if prefix is ''
      prefix = window.location.protocol
    newWindow = window.open "#{prefix}//#{crumbs.join '/'}", target
    newWindow.focus()


emitHeader = ($header, $page, pageObject) ->
  if pageObject.isRecycler()
    remote = 'recycler'
  else
    remote = pageObject.getRemoteSite location.host
  tooltip = pageObject.getRemoteSiteDetails location.host
  $header.append """
    <h1 title="#{tooltip}">
      <span>
        <a href="#{pageObject.siteLineup()}" target="#{remote}">
          <img src="#{wiki.site(remote).flag()}" height="32px" class="favicon"></a>
        #{resolve.escape pageObject.getTitle()}
      </span>
    </h1>
  """
  $header.find('a').on 'click', handleHeaderClick

emitTimestamp = ($header, $page, pageObject) ->
  if $page.attr('id').match /_rev/
    $page.addClass('ghost')
    $page.data('rev', pageObject.getRevision())
    $header.append $ """
      <h2 class="revision">
        <span>
          #{pageObject.getTimestamp()}
        </span>
      </h2>
    """

emitControls = ($journal) ->
  $journal.append """
    <div class="control-buttons">
      <a href="#" class="button fork-page" title="fork this page">#{actionSymbols.fork}</a>
      <a href="#" class="button add-factory" title="add paragraph">#{actionSymbols.add}</a>
    </div>
  """

emitFooter = ($footer, pageObject) ->
  host = pageObject.getRemoteSite(location.host)
  slug = pageObject.getSlug()
  $footer.append """
    <a class="show-page-license" href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank">CC BY-SA 4.0</a> .
    <a class="show-page-source" href="#{wiki.site(host).getDirectURL(slug)}.json" title="source">JSON</a> .
    <a href= "#{wiki.site(host).getDirectURL(slug)}.html" date-slug="#{slug}" target="#{host}">#{host} </a> .
    <a href= "#" class=search>search</a>
  """

editDate = (journal) ->
  for action in (journal || []) by -1
    return action.date if action.date and action.type != 'fork'
  undefined

emitTwins = ($page) ->
  page = $page.data 'data'
  return unless page
  site = $page.data('site') or window.location.host
  site = window.location.host if site in ['view', 'origin']
  slug = asSlug page.title
  if viewing = editDate(page.journal)
    bins = {newer:[], same:[], older:[]}
    # {fed.wiki.org: [{slug: "happenings", title: "Happenings", date: 1358975303000, synopsis: "Changes here ..."}]}
    for remoteSite, info of neighborhood.sites
      if remoteSite != site and info.sitemap?
        for item in info.sitemap
          if item.slug == slug
            bin = if item.date > viewing then bins.newer
            else if item.date < viewing then bins.older
            else bins.same
            bin.push {remoteSite, item}
    twins = []
    # {newer:[remoteSite: "fed.wiki.org", item: {slug: ..., date: ...}, ...]}
    for legend, bin of bins
      continue unless bin.length
      bin.sort (a,b) ->
        a.item.date < b.item.date
      flags = for {remoteSite, item}, i in bin
        break if i >= 8
        """<img class="remote"
          src="#{wiki.site(remoteSite).flag()}"
          data-slug="#{slug}"
          data-site="#{remoteSite}"
          title="#{remoteSite}">
        """
      twins.push "#{flags.join '&nbsp;'} #{legend}"
    $page.find('.twins').html """<p><span>#{twins.join ", "}</span></p>""" if twins

renderPageIntoPageElement = (pageObject, $page) ->
  $page.data("data", pageObject.getRawPage())
  $page.data("site", pageObject.getRemoteSite()) if pageObject.isRemote()

  console.log '.page keys ', ($(each).data('key') for each in $('.page'))
  console.log 'lineup keys', lineup.debugKeys()

  resolve.resolutionContext = pageObject.getContext()

  $page.empty()
  $paper = $("<div class='paper' />")
  $page.append($paper)
  [$handleParent, $twins, $header, $story, $journal, $footer] = ['handle-parent', 'twins', 'header', 'story', 'journal', 'footer'].map (className) ->
    $('<div />').addClass(className).appendTo($paper) if className != 'journal' or $('.editEnable').is(':visible')
  $pagehandle = $('<div />').addClass('page-handle').appendTo($handleParent)

  emitHeader $header, $page, pageObject
  emitTimestamp $header, $page, pageObject

  pageObject.seqItems (item, done) ->
    $item = $ """<div class="item #{item.type}" data-id="#{item.id}">"""
    $story.append $item
    plugin.do $item, item, done

  if $('.editEnable').is(':visible')
    pageObject.seqActions (each, done) ->
      addToJournal $journal, each.separator if each.separator
      addToJournal $journal, each.action
      done()

  emitTwins $page
  emitControls $journal if $('.editEnable').is(':visible')
  emitFooter $footer, pageObject
  $pagehandle.css({
    height: "#{$story.position().top-$handleParent.position().top-5}px"
  })


createMissingFlag = ($page, pageObject) ->
  unless pageObject.isRemote()
    $('img.favicon',$page).on('error', ->
      plugin.get 'favicon', (favicon) ->
        favicon.create())

rebuildPage = (pageObject, $page) ->
  $page.addClass('local') if pageObject.isLocal()
  $page.addClass('recycler') if pageObject.isRecycler()
  $page.addClass('remote') if pageObject.isRemote()
  $page.addClass('plugin') if pageObject.isPlugin()

  renderPageIntoPageElement pageObject, $page
  createMissingFlag $page, pageObject

  #STATE -- update url when adding new page, removing others
  state.setUrl()

  if $('.editEnable').is(':visible')
    initDragging $page
    initMerging $page
    initAddButton $page
  $page

buildPage = (pageObject, $page) ->
  $page.data('key', lineup.addPage(pageObject))
  rebuildPage(pageObject, $page)

newFuturePage = (title, create) ->
  slug = asSlug title
  pageObject = newPage()
  pageObject.setTitle(title)
  hits = []
  for site, info of neighborhood.sites
    if info.sitemap?
      result = _.find info.sitemap, (each) ->
        each.slug == slug
      if result?
        hits.push
          "type": "reference"
          "site": site
          "slug": slug
          "title": result.title || slug
          "text": result.synopsis || ''
  if hits.length > 0
    pageObject.addItem
      'type': 'future'
      'text': 'We could not find this page in the expected context.'
      'title': title
      'create': create
    pageObject.addItem
      'type': 'paragraph'
      'text': "We did find the page in your current neighborhood."
    pageObject.addItem hit for hit in hits
  else
     pageObject.addItem
      'type': 'future'
      'text': 'We could not find this page.'
      'title': title
      'create': create
  pageObject

cycle = ->
  $page = $(this)

  [slug, rev] = $page.attr('id').split('_rev')
  pageInformation = {
    slug: slug
    rev: rev
    site: $page.data('site')
  }

  whenNotGotten = ->
    link = $("""a.internal[href="/#{slug}.html"]:last""")
    title = link.text() or slug
    key = link.parents('.page').data('key')
    create = lineup.atKey(key)?.getCreate()
    pageObject = newFuturePage(title)
    buildPage( pageObject, $page ).addClass('ghost')


  whenGotten = (pageObject) ->
    buildPage( pageObject, $page )
    for site in pageObject.getNeighbors(location.host)
      neighborhood.registerNeighbor site

  pageHandler.get
    whenGotten: whenGotten
    whenNotGotten: whenNotGotten
    pageInformation: pageInformation

module.exports = {cycle, emitTwins, buildPage, rebuildPage, newFuturePage}
