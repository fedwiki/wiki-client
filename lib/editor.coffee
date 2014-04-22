# Editor provides a small textarea for editing wiki markup.
# It can split and join paragraphs markup but leaves other
# types alone assuming they will interpret multiple lines.

plugin = require './plugin'
itemz = require './itemz'
util = require './util'
pageHandler = require './pageHandler'

createTextElement = ($page, beforeElement, initialText) ->
  item =
    type: 'paragraph'
    id: util.randomBytes(8)
    text: initialText
  itemElement = $ """
    <div class="item paragraph" data-id=#{item.id}></div>
                  """
  itemElement
    .data('item', item)
    .data('pageElement', $page)
  beforeElement.after itemElement
  plugin.do itemElement, item
  itemBefore = itemz.getItem beforeElement
  textEditor itemElement, item
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
        sel = util.getSelectionPos(textarea) # position of caret or selected text coords
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
    util.setCaretPosition textarea, caretPos
  else if doubleClicked # we want the caret to be at the end
    util.setCaretPosition textarea, textarea.val().length
    #scrolls to bottom of text area
    textarea.scrollTop(textarea[0].scrollHeight - textarea.height())
  else
    textarea.focus()



module.exports = {textEditor}