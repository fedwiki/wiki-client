editor = require './editor'
resolve = require './resolve'

emit = (div, item) ->
  for text in item.text.split /\n\n+/
    div.append "<p>#{resolve.resolveLinks(text)}</p>" if text.match /\S/
bind = (div, item) ->
  div.dblclick -> editor.textEditor div, item, null, true

module.exports = {emit, bind}