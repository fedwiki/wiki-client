# This module interprets journal actions in order to update
# a story or even regenerate a complete story from some or
# all of a journal.

apply = (page, action) ->
  order = (item.id for item in page.story||[])
  page.story ||= []

  switch action.type
    when 'create'
      if action.item?
        page.title = action.item.title if action.item.title?
        page.story = action.item.story if action.item.story?
    when 'add'
      if (index = order.indexOf action.after) != -1
        page.story.splice(index+1,0,action.item)
      else
        page.story.push action.item
    when 'edit'
      if (index = order.indexOf action.id) != -1
        page.story.splice(index,1,action.item)
      else
        page.story.push action.item
    when 'move'
      items = {}
      for item in page.story
        items[item.id] = item
      page.story = []
      for id in action.order
        page.story.push(items[id]) if items[id]?
    when 'remove'
      if (index = order.indexOf action.id) != -1
        page.story.splice(index,1)
  page.journal ||= []
  page.journal.push action

create = (revIndex, data) ->
  revIndex = +revIndex
  revJournal = data.journal[0..revIndex]
  revPage = {title: data.title, story: []}
  for action in revJournal
    apply revPage, action
  return revPage

module.exports = {create, apply}