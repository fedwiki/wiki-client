# We have exposed many parts of the core javascript to dynamically
# loaded plugins through bindings in the global "wiki". We expect
# to deprecate many of these as the plugin api matures. We once used
# the global to communicate between core modules but have now
# moved all of that responsibility onto browserify.

# We have canvased plugin repos in github.com/fedwiki to find
# the known uses of wiki globals. We notice that most entry
# points are used. We mark unused entries with ##.

wiki = {}

# known use: (eventually all server directed xhr and some tags)

siteAdapter = require './siteAdapter'
wiki.local = siteAdapter.local
wiki.origin = siteAdapter.origin
wiki.recycler = siteAdapter.recycler
wiki.site = siteAdapter.site

# known use: wiki.asSlug wiki-plugin-reduce/client/reduce.coffee:

wiki.asSlug = require('./page').asSlug
wiki.newPage = require('./page').newPage

# known use: wiki.createItem wiki-plugin-parse/client/parse.coffee:
# known use: wiki.removeItem wiki-plugin-parse/client/parse.coffee:
# known use: wiki.getItem  wiki-plugin-changes/client/changes.coffee:

itemz = require './itemz'
wiki.removeItem = itemz.removeItem
wiki.createItem = itemz.createItem
wiki.getItem = itemz.getItem

# known use: wiki.dialog wiki-plugin-changes/client/changes.coffee:
# known use: wiki.dialog wiki-plugin-chart/client/chart.coffee:
# known use: wiki.dialog wiki-plugin-data/client/data.coffee:
# known use: wiki.dialog wiki-plugin-efficiency/client/efficiency.coffee:
# known use: wiki.dialog wiki-plugin-linkmap/client/linkmap.coffee:
# known use: wiki.dialog wiki-plugin-method/client/method.coffee:
# known use: wiki.dialog wiki-plugin-radar/client/radar.coffee:
# known use: wiki.dialog wiki-plugin-reduce/client/reduce.coffee:
# known use: wiki.dialog wiki-plugin-txtzyme/client/txtzyme.coffee:

dialog = require './dialog'
wiki.dialog = dialog.open

# known use: wiki.doInternalLink wiki-plugin-force/client/force.coffee:
# known use: wiki.doInternalLink wiki-plugin-radar/client/radar.coffee:

link = require('./link')
wiki.createPage = link.createPage ##
wiki.doInternalLink = link.doInternalLink
wiki.showResult = link.showResult

# known use: wiki.getScript  wiki-plugin-bars/client/bars.coffee:
# known use: wiki.getScript  wiki-plugin-code/client/code.coffee:
# known use: wiki.getScript  wiki-plugin-force/client/force.coffee:
# known use: wiki.getScript  wiki-plugin-line/client/line.coffee:
# known use: wiki.getScript  wiki-plugin-map/client/map.coffee:
# known use: wiki.getScript  wiki-plugin-mathjax/client/mathjax.coffee:
# known use: wiki.getScript  wiki-plugin-pushpin/client/pushpin.coffee:
# known use: wiki.getScript  wiki-plugin-radar/client/radar.coffee:
# known use: wiki.getPlugin  wiki-plugin-reduce/client/reduce.coffee:
# known use: wiki.doPlugin wiki-plugin-changes/client/changes.coffee:
# known use: wiki.registerPlugin wiki-plugin-changes/client/changes.coffee:

plugin = require './plugin'
wiki.getScript = plugin.getScript
wiki.getPlugin = plugin.getPlugin
wiki.doPlugin = plugin.doPlugin
wiki.registerPlugin = plugin.registerPlugin
wiki.renderFrom = plugin.renderFrom

# known use: wiki.getData  wiki-plugin-bars/client/bars.coffee:
# known use: wiki.getData  wiki-plugin-calculator/client/calculator.coffee:
# known use: wiki.getData  wiki-plugin-force/client/force.coffee:
# known use: wiki.getData  wiki-plugin-line/client/line.coffee:

wiki.getData = (vis) ->
  if vis
    idx = $('.item').index(vis)
    who = $(".item:lt(#{idx})").filter('.chart,.data,.calculator').last()
    if who? then who.data('item').data else {}
  else
    who = $('.chart,.data,.calculator').last()
    if who? then who.data('item').data else {}

# known use: wiki.getDataNodes wiki-plugin-metabolism/client/metabolism.coffee:
# known use: wiki.getDataNodes wiki-plugin-method/client/method.coffee:

wiki.getDataNodes = (vis) ->
  if vis
    idx = $('.item').index(vis)
    who = $(".item:lt(#{idx})").filter('.chart,.data,.calculator').toArray().reverse()
    $(who)
  else
    who = $('.chart,.data,.calculator').toArray().reverse()
    $(who)

# known use: wiki.log  wiki-plugin-calculator/client/calculator.coffee:
# known use: wiki.log  wiki-plugin-calendar/client/calendar.coffee:
# known use: wiki.log  wiki-plugin-changes/client/changes.coffee:
# known use: wiki.log  wiki-plugin-efficiency/client/efficiency.coffee:
# known use: wiki.log  wiki-plugin-parse/client/parse.coffee:
# known use: wiki.log  wiki-plugin-radar/client/radar.coffee:
# known use: wiki.log  wiki-plugin-txtzyme/client/txtzyme.coffee:

wiki.log = (things...) ->
  console.log things... if console?.log?

# known use: wiki.neighborhood wiki-plugin-activity/client/activity.coffee:
# known use: wiki.neighborhoodObject  wiki-plugin-activity/client/activity.coffee:
# known use: wiki.neighborhoodObject  wiki-plugin-roster/client/roster.coffee:


neighborhood = require './neighborhood'
wiki.neighborhood = neighborhood.sites
wiki.neighborhoodObject = neighborhood

# known use: wiki.pageHandler  wiki-plugin-changes/client/changes.coffee:
# known use: wiki.pageHandler  wiki-plugin-map/client/map.coffee:

pageHandler = require './pageHandler'
wiki.pageHandler = pageHandler
wiki.useLocalStorage = pageHandler.useLocalStorage ##

# known use: wiki.resolveFrom  wiki-plugin-federatedwiki/client/federatedWiki.coffee:
# known use: wiki.resolveLinks wiki-plugin-chart/client/chart.coffee:
# known use: wiki.resolveLinks wiki-plugin-data/client/data.coffee:
# known use: wiki.resolveLinks wiki-plugin-efficiency/client/efficiency.coffee:
# known use: wiki.resolveLinks wiki-plugin-federatedwiki/client/federatedWiki.coffee:
# known use: wiki.resolveLinks wiki-plugin-logwatch/client/logwatch.coffee:
# known use: wiki.resolveLinks wiki-plugin-mathjax/client/mathjax.coffee:

resolve = require './resolve'
wiki.resolveFrom = resolve.resolveFrom
wiki.resolveLinks = resolve.resolveLinks
wiki.resolutionContext = resolve.resolutionContext ##

# known use: wiki.textEditor wiki-plugin-bytebeat/client/bytebeat.coffee:
# known use: wiki.textEditor wiki-plugin-calculator/client/calculator.coffee:
# known use: wiki.textEditor wiki-plugin-calendar/client/calendar.coffee:
# known use: wiki.textEditor wiki-plugin-code/client/code.coffee:
# known use: wiki.textEditor wiki-plugin-data/client/data.coffee:
# known use: wiki.textEditor wiki-plugin-efficiency/client/efficiency.coffee:
# known use: wiki.textEditor wiki-plugin-federatedwiki/client/federatedWiki.coffee:
# known use: wiki.textEditor wiki-plugin-mathjax/client/mathjax.coffee:
# known use: wiki.textEditor wiki-plugin-metabolism/client/metabolism.coffee:
# known use: wiki.textEditor wiki-plugin-method/client/method.coffee:
# known use: wiki.textEditor wiki-plugin-pagefold/client/pagefold.coffee:
# known use: wiki.textEditor wiki-plugin-parse/client/parse.coffee:
# known use: wiki.textEditor wiki-plugin-radar/client/radar.coffee:
# known use: wiki.textEditor wiki-plugin-reduce/client/reduce.coffee:
# known use: wiki.textEditor wiki-plugin-txtzyme/client/txtzyme.coffee:

editor = require './editor'
wiki.textEditor = editor.textEditor

# known use: wiki.util wiki-plugin-activity/client/activity.coffee:

wiki.util = require './util'

# known use: wiki.security views/static.html
wiki.security = require './security'


# known use: require wiki-clint/lib/synopsis wiki-node-server/lib/page.coffee
# known use: require wiki-clint/lib/synopsis wiki-node-server/lib/leveldb.js
# known use: require wiki-clint/lib/synopsis wiki-node-server/lib/mongodb.js
# known use: require wiki-clint/lib/synopsis wiki-node-server/lib/redis.js

wiki.createSynopsis = require('./synopsis') ##

# known uses: (none yet)
wiki.lineup = require './lineup'

module.exports = wiki
