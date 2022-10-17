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
    .on 'keydown', (e) -> startTargeting e if e.keyCode == 16
    .on 'keyup', (e) -> stopTargeting e if e.keyCode == 16
  $('.main')
    .on 'mouseenter', '.item', enterItem
    .on 'mouseleave', '.item', leaveItem
    .on 'mouseenter', '.action', enterAction
    .on 'mouseleave', '.action', leaveAction
    .on 'align-item', '.page', alignItem
    .on 'mouseenter', '.backlinks .remote', enterBacklink
    .on 'mouseleave', '.backlinks .remote', leaveBacklink


startTargeting = (e) ->
  targeting = e.shiftKey
  if targeting
    $('.emit').addClass('highlight')
    if id = item || action
      $("[data-id=#{id}]").addClass('target')
    if itemElem
      consumed = itemElem.consuming
      if consumed
        consumed.forEach (i) -> itemFor(i).addClass('consumed')



stopTargeting = (e) ->
  targeting = e.shiftKey
  unless targeting
    $('.emit').removeClass('highlight')
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


enterBacklink = (e) ->
  item = ($item = $(this)).attr('data-id')
  itemElem = $item[0]
  if targeting
    $("[data-id=#{item}]").addClass('target')
    key = ($page = $(this).parents('.page:first')).data('key')
    place = $item.offset().top
    $('.page').trigger('align-item', {key, id: item, place})

leaveBacklink = (e) ->
  if targeting
    $('.item, .action').removeClass('target')
  item = null
  itemElem = null

alignItem = (e, align) ->
  $page = $(this)
  return if $page.data('key') == align.key
  $item = $page.find(".item[data-id=#{align.id}]")
  return unless $item.length
  place = align.place || $page.height()/2
  offset = $item.offset().top + $page.scrollTop() - place
  $page.stop().animate {scrollTop: offset}, 'slow'



module.exports = {bind}
