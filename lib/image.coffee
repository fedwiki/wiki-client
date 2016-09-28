# An Image plugin presents a picture with a caption. The image source
# can be any URL but we have been using "data urls" so as to get the
# proper sharing semantics if not storage efficency.

dialog = require './dialog'
editor = require './editor'
resolve = require './resolve'

ipfs = false
gateway = "http://localhost:8080"
$.ajax "#{gateway}/ipfs/Qmb1oS3TaS8vekxXqogoYsixe47sXcVxQ22kPWH8VSd7yQ",
  timeout: 30000
  success: (data) -> ipfs = data == "wiki\n"
  complete: (xhr, status) -> console.log "ipfs gateway #{status}"

emit = ($item, item) ->
  item.text ||= item.caption
  $item.append "<img class=thumbnail src=\"#{item.url}\"> <p>#{resolve.resolveLinks(item.text)}</p>"

bind = ($item, item) ->
  $item.dblclick ->
    editor.textEditor $item, item

  $item.find('img').dblclick (event) ->
    event.stopPropagation()
    url = if ipfs and item.ipfs?
      "#{gateway}/ipfs/#{item.ipfs}"
    else
      item.url
    dialog.open item.text, """<img style="width:100%" src="#{url}">"""

module.exports = {emit, bind}