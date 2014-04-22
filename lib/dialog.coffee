# Dialog manages a single <div> that is used to present a
# jQuery UI dialog used for detail display, usually on
# double click.

resolve = require './resolve'

$dialog = null

emit = ->
  $dialog = $('<div></div>')
    .html('This dialog will show every time!')
    .dialog { autoOpen: false, title: 'Basic Dialog', height: 600, width: 800 }

open = (title, html) ->
  $dialog.html html
  $dialog.dialog "option", "title", resolve.resolveLinks(title)
  $dialog.dialog 'open'

module.exports = {emit, open}