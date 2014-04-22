dialog = require './dialog'
editor = require './editor'
resolve = require './resolve'

emit = (div, item) ->
  item.text ||= item.caption
  div.append "<img class=thumbnail src=\"#{item.url}\"> <p>#{resolve.resolveLinks(item.text)}</p>"

bind = (div, item) ->
  div.dblclick -> editor.textEditor div, item
  div.find('img').dblclick -> dialog.open item.text, this

module.exports = {emit, bind}