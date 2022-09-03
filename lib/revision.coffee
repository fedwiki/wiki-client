# This module interprets journal actions in order to update
# a story or even regenerate a complete story from some or
# all of a journal.

apply = (page, action) ->

  order = ->
    (item?.id for item in page.story||[])

  add = (after, item) ->
    index = order().indexOf(after) + 1
    page.story.splice(index, 0, item)

  remove = ->
    if (index = order().indexOf action.id) != -1
      page.story.splice(index,1)

  page.story ||= []

  switch action.type
    when 'create'
      if action.item?
        page.title = action.item.title if action.item.title?
        page.story = action.item.story.slice() if action.item.story?
    when 'add'
      add action.after, action.item
    when 'edit'
      if (index = order().indexOf action.id) != -1
        page.story.splice(index,1,action.item)
      else
        page.story.push action.item
    when 'move'
      # construct relative addresses from absolute order
      index = action.order.indexOf action.id
      after = action.order[index-1]
      item = page.story[order().indexOf action.id]
      remove()
      add after, item
    when 'remove'
      remove()

  page.journal ||= []
  if action.fork
    # implicit fork
    page.journal.push({type: 'fork', site: action.fork })
  page.journal.push action

create = (revIndex, data) ->
  revIndex = +revIndex
  revJournal = data.journal[0..revIndex]
  revPage = {title: data.title, story: []}
  for action in revJournal
    apply revPage, action||{}
  return revPage

module.exports = {create, apply}