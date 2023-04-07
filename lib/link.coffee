# Here is where we attach federated semantics to internal
# links. Call doInternalLink to add a new page to the display
# given a page name, a place to put it an an optional site
# to retrieve it from.

lineup = require './lineup'
active = require './active'
refresh = require './refresh'
{asTitle, asSlug, pageEmitter} = require './page'

createPage = (name, loc, title=null) ->
  site = loc if loc and loc isnt 'view'
  title = asTitle(name) unless title
  $page = $ """
    <div class="page" id="#{name}" tabindex="-1">
      <div class="paper">
        <div class="twins"> <p> </p> </div>
        <div class="header">
          <h1> <img class="favicon" src="#{wiki.site(site).flag()}" height="32px"> #{title} </h1>
        </div>
      </div>
    </div>
  """
  $page.data('site', site) if site
  $page

showPage = (name, loc, title=null) ->
  createPage(name, loc, title).appendTo('.main').each((_i, e) -> refresh.cycle($(e)))

doInternalLink = (title, $page, site=null) ->
  slug = asSlug(title)
  $($page).nextAll().remove() if $page?
  lineup.removeAllAfterKey $($page).data('key') if $page?
  showPage(slug, site, title)
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
  # console.log 'pageEmitter handling', page
  showResult page

module.exports = {createPage, doInternalLink, showPage, showResult}
