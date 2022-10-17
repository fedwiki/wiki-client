# The Paragraph plugin holds text that can be edited and rendered
# with hyperlinks. It will eventually escape html tags but for the
# moment we live dangerously.

editor = require './editor'
resolve = require './resolve'
itemz = require './itemz'

type = (text) ->
  if text.match /<(i|b|p|a|h\d|hr|br|li|img|div|span|table|blockquote)\b.*?>/i
    'html'
  else
    'markdown'

emit = ($item, item) ->
  for text in item.text.split /\n\n+/
    $item.append "<p>#{resolve.resolveLinks(text)}</p>" if text.match /\S/

bind = ($item, item) ->
  $item.on 'dblclick', (e) ->
    if e.shiftKey
      item.type = type(item.text)
      itemz.replaceItem $item, 'paragraph', item
    else
      editor.textEditor $item, item, {'append': true}

module.exports = {emit, bind}