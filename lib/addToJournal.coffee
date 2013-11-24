util = require './util'

module.exports = (journalElement, action) ->
  pageElement = journalElement.parents('.page:first')
  actionTitle = action.type || 'separator'
  actionTitle += " #{util.formatElapsedTime(action.date)}" if action.date?
  actionElement = $("""<a href="#" /> """).addClass("action").addClass(action.type || 'separator')
    .text(action.symbol || util.symbols[action.type])
    .attr('title',actionTitle)
    .attr('data-id', action.id || "0")
    .data('action', action)
  controls = journalElement.children('.control-buttons')
  if controls.length > 0
    actionElement.insertBefore(controls)
  else
    actionElement.appendTo(journalElement)
  if action.type == 'fork' and action.site?
    actionElement
      .css("background-image", "url(//#{action.site}/favicon.png)")
      .attr("href", "//#{action.site}/#{pageElement.attr('id')}.html")
      .data("site", action.site)
      .data("slug", pageElement.attr('id'))

