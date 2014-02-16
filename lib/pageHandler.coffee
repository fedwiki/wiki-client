_ = require 'underscore'

wiki = require './wiki'
util = require './util'
state = require './state'
revision = require './revision'
addToJournal = require './addToJournal'
newPage = require('./page').newPage

module.exports = pageHandler = {}

pageFromLocalStorage = (slug)->
  if json = localStorage[slug]
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
    url: url + "?random=#{util.randomBytes(4)}"
    success: (page) ->
      page = revision.create rev, page if rev
      return whenGotten newPage(page, site)
    error: (xhr, type, msg) ->
      if (xhr.status != 404) and (xhr.status != 0)
        wiki.log 'pageHandler.get error', xhr, xhr.status, type, msg
        troublePageObject = newPage {title: "Trouble: Can't Get Page"}, null
        troublePageObject.addParagraph """
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

pushToLocal = (pageElement, pagePutInfo, action) ->
  if action.type == 'create'
    page = {title: action.item.title, story:[], journal:[]}
  else
    page = pageFromLocalStorage pagePutInfo.slug
    page ||= pageElement.data("data")
    page.journal = [] unless page.journal?
    if (site=action['fork'])?
      page.journal = page.journal.concat({'type':'fork','site':site})
      delete action['fork']
    page.story = $(pageElement).find(".item").map(-> $(@).data("item")).get()
  page.journal = page.journal.concat(action)
  localStorage[pagePutInfo.slug] = JSON.stringify(page)
  addToJournal pageElement.find('.journal'), action

pushToServer = (pageElement, pagePutInfo, action) ->
  $.ajax
    type: 'PUT'
    url: "/page/#{pagePutInfo.slug}/action"
    data:
      'action': JSON.stringify(action)
    success: () ->
      addToJournal pageElement.find('.journal'), action
      if action.type == 'fork' # push
        localStorage.removeItem pageElement.attr('id')
    error: (xhr, type, msg) ->
      wiki.log "pageHandler.put ajax error callback", type, msg

pageHandler.put = (pageElement, action) ->

  checkedSite = () ->
    switch site = pageElement.data('site')
      when 'origin', 'local', 'view' then null
      when location.host then null
      else site

  # about the page we have
  pagePutInfo = {
    slug: pageElement.attr('id').split('_rev')[0]
    rev: pageElement.attr('id').split('_rev')[1]
    site: checkedSite()
    local: pageElement.hasClass('local')
  }
  forkFrom = pagePutInfo.site
  wiki.log 'pageHandler.put', action, pagePutInfo

  # detect when fork to local storage
  if wiki.useLocalStorage()
    if pagePutInfo.site?
      wiki.log 'remote => local'
    else if !pagePutInfo.local
      wiki.log 'origin => local'
      action.site = forkFrom = location.host
    # else if !pageFromLocalStorage(pagePutInfo.slug)
    #   wiki.log ''
    #   action.site = forkFrom = pagePutInfo.site
    #   wiki.log 'local storage first time', action, 'forkFrom', forkFrom

  # tweek action before saving
  action.date = (new Date()).getTime()
  delete action.site if action.site == 'origin'

  # update dom when forking
  if forkFrom
    # pull remote site closer to us
    pageElement.find('h1 img').attr('src', '/favicon.png')
    pageElement.find('h1 a').attr('href', '/')
    pageElement.data('site', null)
    pageElement.removeClass('remote')
    state.setUrl()
    if action.type != 'fork'
      # bundle implicit fork with next action
      action.fork = forkFrom
      addToJournal pageElement.find('.journal'),
        type: 'fork'
        site: forkFrom
        date: action.date

  # store as appropriate
  if wiki.useLocalStorage() or pagePutInfo.site == 'local'
    pushToLocal(pageElement, pagePutInfo, action)
    pageElement.addClass("local")
  else
    pushToServer(pageElement, pagePutInfo, action)

