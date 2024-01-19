# Dialog manages a single popup window that is used to present a
# dialog used for detail display, usually on double click.

open = (title, html) ->
  body = html
  if typeof html is 'object'
    body = html[0].outerHTML

  dialogWindow = window.open('/dialog/#', 'dialog', 'popup,height=600,width=800')

  if dialogWindow.location.pathname isnt '/dialog/'
    # this will only happen when popup is first opened.
    dialogWindow.addEventListener 'load', (event) ->
      dialogWindow.postMessage({ title, body }, window.origin)
  else
    dialogWindow.postMessage({ title, body }, window.origin)

module.exports = { open }