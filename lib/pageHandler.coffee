# The pageHandler bundles fetching and storing json pages
# from origin, remote and browser local storage. It handles
# incremental updates and implicit forks when pages are edited.

_ = require 'underscore'

state = require './state'
revision = require './revision'
addToJournal = require './addToJournal'
newPage = require('./page').newPage
random = require './random'
lineup = require './lineup'
neighborhood = require './neighborhood'

module.exports = pageHandler = {}

deepCopy = (object) ->
  JSON.parse JSON.stringify object

pageHandler.useLocalStorage = ->
  $(".login").length > 0

pageFromLocalStorage = (slug)->
  if json = localStorage.getItem(slug)
    JSON.parse(json)
  else
    undefined

recursiveGet = ({pageInformation, whenGotten, whenNotGotten, localContext}) ->
  {slug,rev,site} = pageInformation

  if site
    localContext = []
  else
    site = localContext.shift()

  site = 'origin' if site is window.location.host
  site = null if site=='view'

  if site?
    if site == 'local'
      if localPage = pageFromLocalStorage(pageInformation.slug)
        #NEWPAGE local from pageHandler.get
        return whenGotten newPage(localPage, 'local' )
      else
        return whenNotGotten()
    else
      if site == 'origin'
        url = "/#{slug}.json"
      else
        url = "http://#{site}/#{slug}.json"
  else
    url = "/#{slug}.json"

  $.ajax
    type: 'GET'
    dataType: 'json'
    url: url + "?random=#{random.randomBytes(4)}"
    success: (page) ->
      page = revision.create rev, page if rev
      #NEWPAGE server from pageHandler.get
      return whenGotten newPage(page, site)
    error: (xhr, type, msg) ->
      if (xhr.status != 404) and (xhr.status != 0)
        console.log 'pageHandler.get error', xhr, xhr.status, type, msg
        #NEWPAGE trouble from PageHandler.get
        troublePageObject = newPage {title: "Trouble: Can't Get Page"}, null
        troublePageObject.addItem
          type: 'html'
          text: """
The page handler has run into problems with this   request.
<pre class=error>#{JSON.stringify pageInformation}</pre>
The requested url.
<pre class=error>#{url}</pre>
The server reported status.
<pre class=error>#{xhr.status}</pre>
The error type.
<pre class=error>#{type}</pre>
The error message.
<pre class=error>#{msg}</pre>
These problems are rarely solved by reporting issues.
There could be additional information reported in the browser's console.log.
More information might be accessible by fetching the page outside of wiki.
<a href="#{url}" target="_blank">try-now</a>
"""
        return whenGotten troublePageObject
      if localContext.length > 0
        recursiveGet( {pageInformation, whenGotten, whenNotGotten, localContext} )
      else
        whenNotGotten()

pageHandler.get = ({whenGotten,whenNotGotten,pageInformation}  ) ->

  unless pageInformation.site
    if localPage = pageFromLocalStorage(pageInformation.slug)
      localPage = revision.create pageInformation.rev, localPage if pageInformation.rev
      return whenGotten newPage( localPage, 'local' )

  pageHandler.context = ['view'] unless pageHandler.context.length

  recursiveGet
    pageInformation: pageInformation
    whenGotten: whenGotten
    whenNotGotten: whenNotGotten
    localContext: _.clone(pageHandler.context)


pageHandler.context = []

pushToLocal = ($page, pagePutInfo, action) ->
  if action.type == 'create'
    page = {title: action.item.title, story:[], journal:[]}
  else
    page = pageFromLocalStorage pagePutInfo.slug
    page ||= lineup.atKey($page.data('key')).getRawPage()
    page.journal = [] unless page.journal?
    if (site=action['fork'])?
      page.journal = page.journal.concat({'type':'fork','site':site,'date':(new Date()).getTime()})
      delete action['fork']
  revision.apply page, action
  localStorage.setItem(pagePutInfo.slug, JSON.stringify(page))
  addToJournal $page.find('.journal'), action
  $page.addClass("local")

pushToServer = ($page, pagePutInfo, action) ->

  # bundle rawPage which server will strip out
  bundle = deepCopy(action)
  pageObject = lineup.atKey $page.data('key')
  if action.type == 'fork'
    bundle.item = deepCopy pageObject.getRawPage()

  $.ajax
    type: 'PUT'
    url: "/page/#{pagePutInfo.slug}/action"
    data:
      'action': JSON.stringify(bundle)
    success: () ->
      # update pageObject (guard for tests)
      pageObject.apply action if pageObject?.apply
      neighborhood.updateSitemap pageObject
      addToJournal $page.find('.journal'), action
      if action.type == 'fork' # push
        localStorage.removeItem $page.attr('id')
    error: (xhr, type, msg) ->
      action.error = {type, msg, response: xhr.responseText}
      pushToLocal $page, pagePutInfo, action

pageHandler.put = ($page, action) ->

  checkedSite = () ->
    switch site = $page.data('site')
      when 'origin', 'local', 'view' then null
      when location.host then null
      else site

  # about the page we have
  pagePutInfo = {
    slug: $page.attr('id').split('_rev')[0]
    rev: $page.attr('id').split('_rev')[1]
    site: checkedSite()
    local: $page.hasClass('local')
  }
  forkFrom = pagePutInfo.site
  console.log 'pageHandler.put', action, pagePutInfo

  # detect when fork to local storage
  if pageHandler.useLocalStorage()
    if pagePutInfo.site?
      console.log 'remote => local'
    else if !pagePutInfo.local
      console.log 'origin => local'
      action.site = forkFrom = location.host
    # else if !pageFromLocalStorage(pagePutInfo.slug)
    #   console.log ''
    #   action.site = forkFrom = pagePutInfo.site
    #   console.log 'local storage first time', action, 'forkFrom', forkFrom

  # tweek action before saving
  action.date = (new Date()).getTime()
  delete action.site if action.site == 'origin'

  # update dom when forking
  if forkFrom
    # pull remote site closer to us
    $page.find('h1').prop('title',location.host)
    $page.find('h1 img').attr('src', '/favicon.png')
    $page.find('h1 a').attr('href', "/view/welcome-visitors/view/#{pagePutInfo.slug}").attr('target',location.host)
    $page.data('site', null)
    $page.removeClass('remote')
    #STATE -- update url when site changes
    state.setUrl()
    if action.type != 'fork'
      # bundle implicit fork with next action
      action.fork = forkFrom
      addToJournal $page.find('.journal'),
        type: 'fork'
        site: forkFrom
        date: action.date

  # store as appropriate
  if pageHandler.useLocalStorage() or pagePutInfo.site == 'local'
    pushToLocal($page, pagePutInfo, action)
  else
    pushToServer($page, pagePutInfo, action)
