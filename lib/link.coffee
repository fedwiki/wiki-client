lineup = require './lineup'
active = require './active'
refresh = require './refresh'
asSlug = require('./page').asSlug

createPage = (name, loc) ->
  site = loc if loc and loc isnt 'view'
  $page = $ """
    <div class="page" id="#{name}">
      <div class="twins"> <p> </p> </div>
      <div class="header">
        <h1> <img class="favicon" src="#{ if site then "//#{site}" else "" }/favicon.png" height="32px"> #{name} </h1>
      </div>
    </div>
  """
  $page.data('site', site) if site
  $page

showPage = (name, loc) ->
  createPage(name, loc).appendTo('.main').each refresh

doInternalLink = (name, page, site=null) ->
  name = asSlug(name)
  $(page).nextAll().remove() if page?
  lineup.removeAllAfterKey $(page).data('key') if page?
  #NEWPAGE (not) wiki.doInteralLink, wiki.createPage, appendTo('.main'), refresh
  showPage(name,site)
  active.set($('.page').last())

showResult = (resultPage) ->
  $resultPage = wiki.createPage(resultPage.getSlug()).addClass('ghost')
  $resultPage.appendTo($('.main'))
  wiki.buildPage( resultPage, $resultPage )
  active.set($('.page').last())


module.exports = {createPage, doInternalLink, showResult}