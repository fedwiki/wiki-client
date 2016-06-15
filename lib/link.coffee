# Here is where we attach federated semantics to internal
# links. Call doInternalLink to add a new page to the display
# given a page name, a place to put it an an optional site
# to retrieve it from.

lineup = require './lineup'
active = require './active'
refresh = require './refresh'
{asTitle, asSlug, pageEmitter} = require './page'

pinned = []

createPage = (name, loc) ->
  site = loc if loc and loc isnt 'view'
  title = asTitle(name)
  $page = $ """
    <div class="page" id="#{name}">
      <div class="paper">
        <div class="twins"> <p> </p> </div>
        <div class="header">
          <h1> <img class="favicon" src="#{ if site then "//#{site}" else "" }/favicon.png" height="32px"> #{title} </h1>
        </div>
      </div>
    </div>
  """
  $page.data('site', site) if site
  $page

showPage = (name, loc) ->
  createPage(name, loc).appendTo('.main').each refresh.cycle

closeAllPages = () ->
  toRemove = (key for key in lineup.debugKeys() when pinned.indexOf(key) == -1)

  # make sure there is at least 1 page left after closing all
  toRemove.splice(0,1) if toRemove.length == lineup.debugKeys().length

  # remove pages that are not pinned
  $(".page").each (i, p) ->
    k = $( p ).data("key")
    if k in toRemove
      $(p).remove() if $(p)?
      lineup.removeKey k

  active.set $('.page').last()

closePage = (name, $page, site=null) ->
  name = asSlug(name)
  if lineup.debugKeys().length > 1 # keep minimum one tab
    lineup.removeKey $($page).data('key') if $page?
    $($page).remove() if $page?
    active.set($('.page').last())

pinPage = (name, $page, site=null) ->
  name = asSlug(name)
  key = $($page).data('key')
  i = pinned.indexOf key
  if i == -1
    pinned.push key
    $page.addClass("pinned")
  else
    pinned.splice(i, 1);
    $page.removeClass("pinned")

doInternalLink = (name, $page, site=null) ->
  name = asSlug(name)
  $($page).nextAll().remove() if $page?
  lineup.removeAllAfterKey $($page).data('key') if $page?
  showPage(name,site)
  active.set($('.page').last())

showResult = (pageObject, options={}) ->
  $(options.$page).nextAll().remove() if options.$page?
  lineup.removeAllAfterKey $(options.$page).data('key') if options.$page?
  slug = pageObject.getSlug()
  slug += "_rev#{options.rev}" if options.rev?
  $page = createPage(slug).addClass('ghost')
  $page.appendTo($('.main'))
  refresh.buildPage( pageObject, $page )
  active.set($('.page').last())

pageEmitter.on 'show', (page) ->
  console.log 'pageEmitter handling', page
  showResult page

module.exports = {createPage, doInternalLink, showPage, showResult, closePage, closeAllPages, pinPage}
