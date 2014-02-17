
module.exports = util = {}

util.symbols =
  create: '☼'
  add: '+'
  edit: '✎'
  fork: '⚑'
  move: '↕'
  remove: '✕'

random = require './random'
util.randomByte = random.randomByte
util.randomBytes = random.randomBytes

format = require './format'
util.formatTime = format.formatTime
util.formatDate = format.formatDate
util.formatElapsedTime = format.formatElapsedTime

# If the selection start and selection end are both the same,
# then you have the caret position. If there is selected text, 
# the browser will not tell you where the caret is, but it will 
# either be at the beginning or the end of the selection 
#(depending on the direction of the selection).
util.getSelectionPos = (jQueryElement) -> 
  el = jQueryElement.get(0) # gets DOM Node from from jQuery wrapper
  if document.selection # IE
    el.focus()
    sel = document.selection.createRange()
    sel.moveStart 'character', -el.value.length
    iePos = sel.text.length
    {start: iePos, end: iePos}
  else
    {start: el.selectionStart, end: el.selectionEnd}

util.setCaretPosition = (jQueryElement, caretPos) ->
  el = jQueryElement.get(0)
  if el?
    if el.createTextRange # IE
      range = el.createTextRange()
      range.move "character", caretPos
      range.select()
    else # rest of the world
      el.setSelectionRange caretPos, caretPos
    el.focus()

