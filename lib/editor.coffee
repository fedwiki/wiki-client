# Editor provides a small textarea for editing wiki markup.
# It can split and join paragraphs markup but leaves other
# types alone assuming they will interpret multiple lines.

plugin = require './plugin'
itemz = require './itemz'
pageHandler = require './pageHandler'
link = require './link'
random = require './random'

sleep = (time, done) -> setTimeout done, setTimeout

createTextElement = ($page, beforeElement, initialText) ->
  item =
    type: 'paragraph'
    id: random.itemId()
    text: initialText
  console.log 'createTextElement', item.id, initialText
  $item = $ """
    <div class="item paragraph" data-id=#{item.id}></div>
                  """
  $item
    .data('item', item)
    .data('pageElement', $page)
  beforeElement.after $item
  plugin.do $item, item
  itemBefore = itemz.getItem beforeElement
  textEditor $item, item
  sleep 500, -> pageHandler.put $page, {item: item, id: item.id, type: 'add', after: itemBefore?.id}


textEditor = ($item, item, option={}) ->
  console.log 'textEditor', item.id, option

  keydownHandler = (e) ->

    if (e.altKey || e.ctlKey || e.metaKey) and e.which == 83 #alt-s
      textarea.focusout()
      return false

    if (e.altKey || e.ctlKey || e.metaKey) and e.which == 73 #alt-i
      e.preventDefault()
      page = $(e.target).parents('.page') unless e.shiftKey
      link.doInternalLink "about #{item.type} plugin", page
      return false

    # provides automatic new paragraphs on enter and concatenation on backspace
    if item.type is 'paragraph'
      sel = getSelectionPos(textarea) # position of caret or selected text coords

      if e.which is $.ui.keyCode.BACKSPACE and sel.start is 0 and sel.start is sel.end
        $previous = $item.prev()
        previous = itemz.getItem $previous
        return false unless previous.type is 'paragraph'
        caret = previous.text.length
        previous.text += textarea.val()
        textarea.val('') # Need current text area to be empty. Item then gets deleted.
        textEditor $previous, previous, {caret}
        return false

      if e.which is $.ui.keyCode.ENTER
        return false unless sel
        text = textarea.val()
        prefix = text.substring 0, sel.start
        suffix = text.substring(sel.end)
        if prefix is ''
          textarea.val(' ')
        else
          textarea.val(prefix)
        textarea.focusout()
        $page = $item.parent().parent()
        createTextElement($page, $item, suffix)
        createTextElement($page, $item, '') if prefix is ''
        return false

  focusoutHandler = ->
    $item.removeClass 'textEditing'
    if item.text = textarea.val()
      plugin.do $item.empty(), item
      return if item.text == original
      pageHandler.put $item.parents('.page:first'), {type: 'edit', id: item.id, item: item}
    else
      pageHandler.put $item.parents('.page:first'), {type: 'remove', id: item.id}
      $item.remove()
    null

  return if $item.hasClass 'textEditing'
  $item.addClass 'textEditing'
  textarea = $("<textarea>#{original = item.text ? ''}</textarea>")
    .focusout focusoutHandler
    .bind 'keydown', keydownHandler
  $item.html textarea
  if option.caret
    setCaretPosition textarea, option.caret
  else if option.append # we want the caret to be at the end
    setCaretPosition textarea, textarea.val().length
    #scrolls to bottom of text area
    textarea.scrollTop(textarea[0].scrollHeight - textarea.height())
  else
    textarea.focus()

# If the selection start and selection end are both the same,
# then you have the caret position. If there is selected text,
# the browser will not tell you where the caret is, but it will
# either be at the beginning or the end of the selection
# (depending on the direction of the selection).

getSelectionPos = (jQueryElement) ->
  el = jQueryElement.get(0) # gets DOM Node from from jQuery wrapper
  if document.selection # IE
    el.focus()
    sel = document.selection.createRange()
    sel.moveStart 'character', -el.value.length
    iePos = sel.text.length
    {start: iePos, end: iePos}
  else
    {start: el.selectionStart, end: el.selectionEnd}

setCaretPosition = (jQueryElement, caretPos) ->
  el = jQueryElement.get(0)
  if el?
    if el.createTextRange # IE
      range = el.createTextRange()
      range.move "character", caretPos
      range.select()
    else # rest of the world
      el.setSelectionRange caretPos, caretPos
    el.focus()

# .bind 'paste', (e) ->
#   console.log 'textedit paste', e
#   console.log e.originalEvent.clipboardData.getData('text')


module.exports = {textEditor}