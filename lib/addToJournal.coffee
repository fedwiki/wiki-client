# A wiki page has a journal of actions that have been completed.
# The addToJournal function is called when the origin server
# response that the network operation is complete.

util = require './util'
actionSymbols = require './actionSymbols'

module.exports = ($journal, action) ->
  $page = $journal.parents('.page:first')
  $action = $("""<a href="#" /> """).addClass("action").addClass(action.type || 'separator')
    .text(action.symbol || actionSymbols.symbols[action.type])
    .attr('title',util.formatActionTitle(action))
    .attr('data-id', action.id || "0")
    .attr('data-date', action.date || "0")
    .data('action', action)
  if action.type is 'add' and action.attribution?
    $action.text(actionSymbols.symbols['copyIn'])
    $action.css("background-image", "url(#{wiki.site(action.attribution.site).flag()})") if action.attribution.site?
  if action.type is 'remove' and action.removedTo?
    $action.text(actionSymbols.symbols['copyOut'])
  controls = $journal.children('.control-buttons')
  if controls.length > 0
    $action.insertBefore(controls)
  else
    $action.appendTo($journal)
  if action.type == 'fork' and action.site?
    $action
      .css("background-image", "url(#{wiki.site(action.site).flag()}")
      .attr("href", "#{wiki.site(action.site).getDirectURL($page.attr('id'))}.html")
      .attr("target", "#{action.site}")
      .data("site", action.site)
      .data("slug", $page.attr('id'))
