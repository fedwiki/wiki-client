# Target handles hovers over items and actions. Other visible
# items and actions with the same id will highlight. In some cases
# an event is generated inviting other pages to scroll the item
# into view. Target tracks hovering even when not requested so
# that highlighting can be immediate when requested.

targeting = false
item = null
itemElem = null
action = null
consumed = null



bind = ->
  $(document)
    .keydown (e) -> startTargeting e if e.keyCode == 16
    .keyup (e) -> stopTargeting e if e.keyCode == 16
  $('.main')
    .delegate '.item', 'mouseenter', enterItem
    .delegate '.item', 'mouseleave', leaveItem
    .delegate '.action', 'mouseenter', enterAction
    .delegate '.action', 'mouseleave', leaveAction
    .delegate '.page', 'align-item', alignItem


startTargeting = (e) ->
  targeting = e.shiftKey
  if targeting
    if id = item || action
      $("[data-id=#{id}]").addClass('target')
    if itemElem
      consumed = itemElem.consuming
      if consumed
        consumed.forEach (i) -> itemFor(i).addClass('consumed')



stopTargeting = (e) ->
  targeting = e.shiftKey
  unless targeting
    $('.item, .action').removeClass 'target'
    $('.item').removeClass 'consumed'

pageFor = (pageKey) ->
  $page = $('.page').filter((_i, page) => $(page).data('key') == pageKey)
  return null if $page.length == 0
  console.log('warning: more than one page found for', key, $page) if $page.length > 1
  return $page

itemFor = (pageItem) ->
  [pageKey, _item] = pageItem.split('/')
  $page = pageFor(pageKey)
  return null if !$page
  $item = $page.find(".item[data-id=#{_item}]")
  return null if $item.length == 0
  console.log('warning: more than one item found for', pageItem, $item) if $item.length > 1
  return $item

enterItem = (e) ->
  item = ($item = $(this)).attr('data-id')
  itemElem = $item[0]
  if targeting
    $("[data-id=#{item}]").addClass('target')
    key = ($page = $(this).parents('.page:first')).data('key')
    place = $item.offset().top
    $('.page').trigger('align-item', {key, id:item, place})
    consumed = itemElem.consuming
    if consumed
      consumed.forEach (i) -> itemFor(i).addClass('consumed')


leaveItem = (e) ->
  if targeting
    $('.item, .action').removeClass('target')
    $('.item').removeClass('consumed')
  item = null
  itemElem = null



enterAction = (e) ->
  action = $(this).data('id')
  if targeting
    $("[data-id=#{action}]").addClass('target')
    key = $(this).parents('.page:first').data('key')
    $('.page').trigger('align-item', {key, id:action})

leaveAction = (e) ->
  if targeting
    $("[data-id=#{action}]").removeClass('target')
  action = null



alignItem = (e, align) ->
  $page = $(this)
  return if $page.data('key') == align.key
  $item = $page.find(".item[data-id=#{align.id}]")
  return unless $item.length
  place = align.place || $page.height()/2
  offset = $item.offset().top + $page.scrollTop() - place
  $page.stop().animate {scrollTop: offset}, 'slow'



module.exports = {bind}
