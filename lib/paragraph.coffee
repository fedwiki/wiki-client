# The Paragraph plugin holds text that can be edited and rendered
# with hyperlinks. It will eventually escape html tags but for the
# moment we live dangerously.

editor = require './editor'
resolve = require './resolve'
itemz = require './itemz'

# http://jsperf.com/encode-html-entities
safe = (str) ->
  str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

emit = ($item, item) ->
  for text in item.text.split /\n\n+/
    $item.append "<p>#{resolve.resolveLinks(safe text)}</p>" if text.match /\S/

bind = ($item, item) ->
  $item.dblclick (e) ->
    if e.shiftKey
      item.type = 'html'
      itemz.replaceItem $item, 'paragraph', item
    else
      editor.textEditor $item, item, null, true

module.exports = {emit, bind}