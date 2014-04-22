# An Image plugin presents a picture with a caption. The image source
# can be any URL but we have been using "data urls" so as to get the
# proper sharing semantics if not storage efficency.

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