# We have exposed many parts of the core javascript to dynamically
# loaded plugins through bindings in the global "wiki". We expect
# to deprecate many of these as the plugin api matures. We once used
# the global to communicate between core modules but have now
# moved all of that responsibility onto browserify.

wiki = {}

wiki.createSynopsis = require('./synopsis').createSynopsis
wiki.persona = require './persona'
wiki.util = require './util'

pageHandler = require './pageHandler'
wiki.pageHandler = pageHandler
wiki.useLocalStorage = pageHandler.useLocalStorage

link = require('./link')
wiki.createPage = link.createPage
wiki.doInternalLink = link.doInternalLink

wiki.asSlug = require('./page').asSlug

wiki.neighborhood = require('./neighborhood').sites

refresh = require './refresh'
wiki.emitTwins = refresh.emitTwins
wiki.buildPage = refresh.buildPage
rebuildPage = refresh.rebuildPage

resolve = require './resolve'
wiki.resolveLinks = resolve.resolveLinks
wiki.resolveFrom = resolve.resolveFrom
wiki.resolutionContext = resolve.resolutionContext

plugin = require './plugin'
wiki.getScript = plugin.getScript
wiki.getPlugin = plugin.getPlugin
wiki.doPlugin = plugin.doPlugin
wiki.registerPlugin = plugin.registerPlugin

itemz = require './itemz'
wiki.removeItem = itemz.removeItem
wiki.createItem = itemz.createItem
wiki.getItem = itemz.getItem

editor = require './editor'
wiki.textEditor = editor.textEditor

dialog = require './dialog'
wiki.dialog = dialog.open


wiki.log = (things...) ->
  console.log things... if console?.log?

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

module.exports = wiki

