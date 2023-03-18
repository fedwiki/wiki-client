# Editor provides a small textarea for editing wiki markup.
# It can split and join paragraphs markup but leaves other
# types alone assuming they will interpret multiple lines.

plugin = require './plugin'
itemz = require './itemz'
pageHandler = require './pageHandler'
link = require './link'
random = require './random'


# Editor takes a div and an item that goes in it.
# Options manage state during splits and joins.
# Options are available to plugins but rarely used.
#
#   caret: position -- sets the cursor at the point of join
#   append: true -- sets the cursor to end and scrolls there
#   after: id -- new item to be added after id
#   sufix: text -- editor opens with unsaved suffix appended
#   field: 'text' -- editor operates on this field of the item

escape = (string) ->
  string
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

textEditor = ($item, item, option={}) ->
  # console.log 'textEditor', item.id, option
  enterCount = 0 if item.type is 'markdown'
  return unless $('.editEnable').is(':visible')

  keydownHandler = (e) ->

    if e.which == 27 #esc for save
      e.preventDefault()
      $textarea.trigger 'focusout'
      return false

    if (e.ctrlKey || e.metaKey) and e.which == 83 #ctrl-s for save
      e.preventDefault()
      $textarea.trigger 'focusout'
      return false

    if (e.ctrlKey || e.metaKey) and e.which == 73 #ctrl-i for information
      e.preventDefault()
      page = $(e.target).parents('.page') unless e.shiftKey
      link.doInternalLink "about #{item.type} plugin", page
      return false

    if (e.ctrlKey || e.metaKey) and e.which == 77 #ctrl-m for menu
      e.preventDefault()
      $item.removeClass(item.type).addClass(item.type = 'factory')
      $textarea.trigger 'focusout'
      return false

    # provides automatic new paragraphs on enter and concatenation on backspace
    if item.type is 'paragraph' or item.type is 'markdown'
      sel = getSelectionPos($textarea) # position of caret or selected text coords

      if e.which is $.ui.keyCode.BACKSPACE and sel.start is 0 and sel.start is sel.end
        $previous = $item.prev()
        previous = itemz.getItem $previous
        return false unless previous.type is item.type
        caret = previous[option.field||'text'].length
        suffix = $textarea.val()
        $textarea.val('') # Need current text area to be empty. Item then gets deleted.
        textEditor $previous, previous, {caret, suffix}
        return false

      if e.which is $.ui.keyCode.ENTER
        # console.log "Type: #{item.type}, enterCount: #{enterCount}"
        return false unless sel
        if item.type is 'markdown'
          enterCount++
        # console.log "Type: #{item.type}, enterCount: #{enterCount}"
        if item.type is 'paragraph' or (item.type is 'markdown' and enterCount is 2)
          $page = $item.parents('.page')
          text = $textarea.val()
          prefix = text.substring(0, sel.start).trim()
          suffix = text.substring(sel.end).trim()
          if prefix is ''
            $textarea.val(suffix)
            $textarea.trigger 'focusout'
            spawnEditor($page, $item.prev(), item.type, prefix)
          else
            $textarea.val(prefix)
            $textarea.trigger 'focusout'
            spawnEditor($page, $item, item.type, suffix)
          return false
      else
        enterCount = 0 if item.type is 'markdown'

  focusoutHandler = ->
    $item.removeClass 'textEditing'
    $textarea.off()
    $page = $item.parents('.page:first')
    if item[option.field||'text'] = $textarea.val()
      # Remove output and source styling as type may have changed.
      $item.removeClass("output-item")
      $item.removeClass (_index, className) ->
        return (className.match(/\S+-source/) || []).join " "
      plugin.do $item.empty(), item
      if option.after
        return if item[option.field||'text'] == ''
        pageHandler.put $page, {type: 'add', id: item.id, item: item, after: option.after}
      else
        return if item[option.field||'text'] == original
        pageHandler.put $page, {type: 'edit', id: item.id, item: item}
    else
      unless option.after
        pageHandler.put $page, {type: 'remove', id: item.id}
      index = $(".item").index($item)
      $item.remove()
      plugin.renderFrom index
    null

  return if $item.hasClass 'textEditing'
  $item.addClass 'textEditing'
  $item.off()
  original = item[option.field||'text'] ? ''
  $textarea = $("<textarea>#{escape original}#{escape option.suffix ? ''}</textarea>")
    .on 'focusout', focusoutHandler
    .on 'keydown', keydownHandler
  $item.html $textarea
  if option.caret
    setCaretPosition $textarea, option.caret
  else if option.append # we want the caret to be at the end
    setCaretPosition $textarea, $textarea.val().length
    #scrolls to bottom of text area
    $textarea.scrollTop($textarea[0].scrollHeight - $textarea.height())
  else
    $textarea.trigger 'focus'

spawnEditor = ($page, $before, type, text) ->
  item =
    type: type
    id: random.itemId()
    text: text
  $item = $ """<div class="item #{item.type}" data-id=#{item.id}></div>"""
  $item
    .data('item', item)
    .data('pageElement', $page)
  $before.after $item
  before = itemz.getItem $before
  textEditor $item, item, {after: before?.id}


# If the selection start and selection end are both the same,
# then you have the caret position. If there is selected text,
# the browser will not tell you where the caret is, but it will
# either be at the beginning or the end of the selection
# (depending on the direction of the selection).

getSelectionPos = ($textarea) ->
  el = $textarea.get(0) # gets DOM Node from from jQuery wrapper
  if document.selection # IE
    el.focus()
    sel = document.selection.createRange()
    sel.moveStart 'character', -el.value.length
    iePos = sel.text.length
    {start: iePos, end: iePos}
  else
    {start: el.selectionStart, end: el.selectionEnd}

setCaretPosition = ($textarea, caretPos) ->
  el = $textarea.get(0)
  if el?
    if el.createTextRange # IE
      range = el.createTextRange()
      range.move "character", caretPos
      range.select()
    else # rest of the world
      el.setSelectionRange caretPos, caretPos
    el.focus()

# # may want special processing on paste eventually
# textarea.bind 'paste', (e) ->
#   console.log 'textedit paste', e
#   console.log e.originalEvent.clipboardData.getData('text')

module.exports = {textEditor}
