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

  localBeforeOrigin = {
    get: (slug, done) ->
      wiki.local.get slug, (err, page) ->
        # console.log [err, page]
        if err?
          wiki.origin.get slug, done
        else
          site = 'local'
          done null, page
  }

  if site
    localContext = []
  else
    site = localContext.shift()

  site = 'origin' if site is window.location.host
  site = 'view' if site == null

  adapter = switch site
    when 'local' then wiki.local
    when 'origin' then wiki.origin
    when 'recycler' then wiki.recycler
    when 'view' then localBeforeOrigin
    else wiki.site(site)

  adapter.get "#{slug}.json", (err, page) ->
    if !err
      # console.log 'got', site, page
      page = revision.create rev, page if rev
      whenGotten newPage(page, site)
    else
      if ([403, 404].includes(err.xhr.status) ) or (err.xhr.status == 0)
        if localContext.length > 0
          recursiveGet( {pageInformation, whenGotten, whenNotGotten, localContext} )
        else
          whenNotGotten()
      else
        url = adapter.getDirectURL(pageInformation.slug)
        text = """
          The page handler has run into problems with this request.
          <pre class=error>#{JSON.stringify pageInformation}</pre>
          The requested url.
          <pre class=error>#{url}</pre>
          The server reported status.
          <pre class=error>#{err.xhr?.status}</pre>
          The error message.
          <pre class=error>#{err.msg}</pre>
          These problems are rarely solved by reporting issues.
          There could be additional information reported in the browser's console.log.
          More information might be accessible by fetching the page outside of wiki.
          <a href="#{url}" target="_blank">try-now</a>
        """
        trouble = newPage {title: "Trouble: Can't Get Page"}, null
        trouble.addItem {type:'html', text}
        whenGotten trouble


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
  wiki.local.put pagePutInfo.slug, page, () ->
    addToJournal $page.find('.journal'), action
    $page.addClass("local")

pushToServer = ($page, pagePutInfo, action) ->

  # bundle rawPage which server will strip out
  bundle = deepCopy(action)
  pageObject = lineup.atKey $page.data('key')
  if action.type == 'fork'
    bundle.item = deepCopy pageObject.getRawPage()

  wiki.origin.put pagePutInfo.slug, bundle, (err) ->
    if err
      action.error = { type: err.type, msg: err.msg, response: err.xhr.responseText}
      pushToLocal $page, pagePutInfo, action
    else
      pageObject.apply action if pageObject?.apply
      neighborhood.updateSitemap pageObject
      neighborhood.updateIndex pageObject
      addToJournal $page.find('.journal'), action
      if action.type == 'fork'
        wiki.local.delete $page.attr('id')
      if action.type != 'fork' and action.fork
        # implicit fork, probably only affects image plugin
        if action.item.type is 'image'
          index = $page.find('.item').index($page.find('#' + action.item.id).context)
          wiki.renderFrom index


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
  # console.log 'pageHandler.put', action, pagePutInfo

  # detect when fork to local storage
  if pageHandler.useLocalStorage()
    if pagePutInfo.site?
      # console.log 'remote => local'
    else if !pagePutInfo.local
      # console.log 'origin => local'
      action.site = forkFrom = location.host
    # else if !pageFromLocalStorage(pagePutInfo.slug)
    #   console.log ''
    #   action.site = forkFrom = pagePutInfo.site
    #   console.log 'local storage first time', action, 'forkFrom', forkFrom

  # tweek action before saving
  action.date = (new Date()).getTime()
  delete action.site if action.site == 'origin'

  # update dom when forking
  $page.removeClass('plugin')
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

pageHandler.delete = (pageObject, $page, done) ->
  # console.log 'delete server-side'
  # console.log 'pageObject:', pageObject
  if pageObject.isRecycler()
    wiki.recycler.delete "#{pageObject.getSlug()}.json", (err) ->
      more = ->
        done err
      setTimeout(more, 300)
  else
    wiki.origin.delete "#{pageObject.getSlug()}.json", (err) ->
      more = ->
        # err = null
        neighborhood.deleteFromSitemap pageObject unless err?
        neighborhood.deleteFromIndex pageObject unless err?
        done err
      setTimeout(more, 300) # simulate server turnaround
