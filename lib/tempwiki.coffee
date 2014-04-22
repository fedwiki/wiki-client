# This file duplicates wiki.coffee but exists to break dependency loops
# while incrementally removing dependencies on wiki.coffee. Eventually
# no file in wiki-client will depend on wiki.coffee, save client.coffee.

wiki = {}

wiki.createSynopsis = require './synopsis'
wiki.persona = require './persona'
wiki.util = require './util'
wiki.pageHandler = require './pageHandler'

link = require('./link')
wiki.createPage = link.createPage
wiki.doInternalLink = link.doInternalLink

wiki.asSlug = require('./page').asSlug

wiki.neighborhood = require('./neighborhood').sites
wiki.mumble = 'foo'

wiki.log = (things...) ->
  console.log things... if console?.log?

wiki.useLocalStorage = ->
  $(".login").length > 0

wiki.resolutionContext = []

wiki.resolveFrom = (addition, callback) ->
  wiki.resolutionContext.push addition
  try
    callback()
  finally
    wiki.resolutionContext.pop()

wiki.getData = (vis) ->
  if vis
    idx = $('.item').index(vis)
    who = $(".item:lt(#{idx})").filter('.chart,.data,.calculator').last()
    if who? then who.data('item').data else {}
  else
    who = $('.chart,.data,.calculator').last()
    if who? then who.data('item').data else {}

wiki.getDataNodes = (vis) ->
  if vis
    idx = $('.item').index(vis)
    who = $(".item:lt(#{idx})").filter('.chart,.data,.calculator').toArray().reverse()
    $(who)
  else
    who = $('.chart,.data,.calculator').toArray().reverse()
    $(who)

wiki.getItem = (element) ->
  $(element).data("item") or $(element).data('staticItem') if $(element).length > 0

wiki.resolveLinks = (string) ->
  renderInternalLink = (match, name) ->
    # spaces become 'slugs', non-alpha-num get removed
    slug = wiki.asSlug name
    "<a class=\"internal\" href=\"/#{slug}.html\" data-page-name=\"#{slug}\" title=\"#{wiki.resolutionContext.join(' => ')}\">#{name}</a>"
  string
    .replace(/\[\[([^\]]+)\]\]/gi, renderInternalLink)
    .replace(/\[((http|https|ftp):.*?) (.*?)\]/gi, """<a class="external" target="_blank" href="$1" title="$1" rel="nofollow">$3 <img src="/images/external-link-ltr-icon.png"></a>""")

module.exports = wiki

