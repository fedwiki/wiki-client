# The itemz module understands how we have been keeping track of
# story items and their corresponding divs. It offers utility
# functions used elsewere. We anticipate a more proper model eventually.

pageHandler = require './pageHandler'
plugin = require './plugin'
random = require './random'


sleep = (time, done) -> setTimeout done, time

getItem = ($item) ->
  $($item).data("item") or $($item).data('staticItem') if $($item).length > 0

removeItem = ($item, item) ->
  pageHandler.put $item.parents('.page:first'), {type: 'remove', id: item.id}
  $item.remove()

createItem = ($page, $before, item) ->
  $page = $before.parents('.page') unless $page?
  item.id = random.itemId()
  $item = $ """
    <div class="item #{item.type}" data-id="#{}"</div>
  """
  $item
    .data('item', item)
    .data('pageElement', $page)
  if $before?
    $before.after $item
  else
    $page.find('.story').append $item
  plugin.do $item, item
  before = getItem $before
  sleep 500, ->
    pageHandler.put $page, {item, id: item.id, type: 'add', after: before?.id}
  $item

replaceItem = ($item, type, item) ->
  newItem = $.extend({}, item)
  $item.empty().off()
  $item.removeClass(type).addClass(newItem.type)
  $page = $item.parents('.page:first')
  try
    $item.data 'pageElement', $page
    $item.data 'item', newItem
    plugin.getPlugin item.type, (plugin) ->
      plugin.emit $item, newItem
      plugin.bind $item, newItem
  catch err
    $item.append "<p class='error'>#{err}</p>"
  pageHandler.put $page, {type: 'edit', id: newItem.id, item: newItem}

module.exports = {createItem, removeItem, getItem, replaceItem}