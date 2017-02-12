# A wiki page has a journal of actions that have been completed.
# The addToJournal function is called when the origin server
# response that the network operation is complete.

util = require './util'
actionSymbols = require './actionSymbols'
siteAdapter = require './siteAdapter'

module.exports = ($journal, action) ->
  $page = $journal.parents('.page:first')
  title = ''
  title += "#{action.site}\n" if action.site?
  title += action.type || 'separator'
  title += " #{util.formatElapsedTime(action.date)}" if action.date?
  $action = $("""<a href="#" /> """).addClass("action").addClass(action.type || 'separator')
    .text(action.symbol || actionSymbols.symbols[action.type])
    .attr('title',title)
    .attr('data-id', action.id || "0")
    .data('action', action)
  controls = $journal.children('.control-buttons')
  if controls.length > 0
    $action.insertBefore(controls)
  else
    $action.appendTo($journal)
  if action.type == 'fork' and action.site?
    siteAdapter.site(action.site).getURL 'favicon.png', (backgroundURL) ->
      siteAdapter.site(action.site).getURL "#{$page.attr('id')}.html", (forkedPage) ->
        $action
          .css("background-image", "url(#{backgroundURL})")
          .attr("href", "#{forkedPage}")
          .attr("target", "#{action.site}")
          .data("site", action.site)
          .data("slug", $page.attr('id'))
