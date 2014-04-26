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


textEditor = (div, item, caretPos, doubleClicked) ->
  return if div.hasClass 'textEditing'
  div.addClass 'textEditing'
  textarea = $("<textarea>#{original = item.text ? ''}</textarea>")
    .focusout ->
      div.removeClass 'textEditing'
      if item.text = textarea.val()
        plugin.do div.empty(), item
        return if item.text == original
        pageHandler.put div.parents('.page:first'), {type: 'edit', id: item.id, item: item}
      else
        pageHandler.put div.parents('.page:first'), {type: 'remove', id: item.id}
        div.remove()
      null
    # .bind 'paste', (e) ->
    #   console.log 'textedit paste', e
    #   console.log e.originalEvent.clipboardData.getData('text')
    .bind 'keydown', (e) ->
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
          prevItem = itemz.getItem(div.prev())
          return false unless prevItem.type is 'paragraph'
          prevTextLen = prevItem.text.length
          prevItem.text += textarea.val()
          textarea.val('') # Need current text area to be empty. Item then gets deleted.
          # caret needs to be between the old text and the new appended text
          textEditor div.prev(), prevItem, prevTextLen
          return false
        else if e.which is $.ui.keyCode.ENTER and item.type is 'paragraph'
          return false unless sel
          text = textarea.val()
          prefix = text.substring 0, sel.start
          middle = text.substring(sel.start, sel.end) if sel.start isnt sel.end
          suffix = text.substring(sel.end)
          if prefix is ''
            textarea.val(' ')
          else
            textarea.val(prefix)
          textarea.focusout()
          $page = div.parent().parent()
          createTextElement($page, div, suffix)
          createTextElement($page, div, middle) if middle?
          createTextElement($page, div, '') if prefix is ''
          return false
  div.html textarea
  if caretPos?
    setCaretPosition textarea, caretPos
  else if doubleClicked # we want the caret to be at the end
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



module.exports = {textEditor}