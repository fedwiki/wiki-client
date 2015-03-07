# Here is where we attach federated semantics to internal
# links. Call doInternalLink to add a new page to the display
# given a page name, a place to put it an an optional site
# to retrieve it from.

lineup = require './lineup'
active = require './active'
refresh = require './refresh'
{asSlug, pageEmitter} = require './page'

createPage = (slug, loc, title=null) ->
  site = loc if loc and loc isnt 'view'
  $page = $ """
    <div class="page" id="#{slug}">
      <div class="twins"> <p> </p> </div>
      <div class="header">
        <h1> <img class="favicon" src="#{ if site then "//#{site}" else "" }/favicon.png" height="32px"> #{name} </h1>
      </div>
    </div>
  """
  $page.data('site', site) if site
  $page.data('title', title) if title
  $page

showPage = (slug, loc, title=null) ->
  createPage(slug, loc, title).appendTo('.main').each refresh.cycle

doInternalLink = (name, $page, site=null) ->
  slug = asSlug(name)
  $($page).nextAll().remove() if $page?
  lineup.removeAllAfterKey $($page).data('key') if $page?
  showPage(slug,site,name)
  active.set($('.page').last())

showResult = (pageObject) ->
  $page = createPage(pageObject.getSlug()).addClass('ghost')
  $page.appendTo($('.main'))
  refresh.buildPage( pageObject, $page )
  active.set($('.page').last())

pageEmitter.on 'show', (page) ->
  console.log 'pageEmitter handling', page
  showResult page

module.exports = {createPage, doInternalLink, showPage, showResult}
