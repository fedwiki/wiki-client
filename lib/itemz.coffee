pageHandler = require './pageHandler'
util = require './util'
plugin = require './plugin'


sleep = (time, done) -> setTimeout done, time

getItem = (element) ->
  $(element).data("item") or $(element).data('staticItem') if $(element).length > 0

removeItem = ($item, item) ->
  pageHandler.put $item.parents('.page:first'), {type: 'remove', id: item.id}
  $item.remove()

createItem = ($page, $before, item) ->
  $page = $before.parents('.page') unless $page?
  item.id = util.randomBytes(8)
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

module.exports = {createItem, removeItem, getItem}