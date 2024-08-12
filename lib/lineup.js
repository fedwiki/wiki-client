# The lineup represents a sequence of pages with possible
# duplication. We maintain the lineup in parallel with
# the DOM list of .page elements. Eventually lineup will
# play a more central role managing calculations and
# display updates.

random = require './random'

pageByKey = {}
keyByIndex = []


# Basic manipulations that correspond to typical user activity

addPage = (pageObject) ->
  key = random.randomBytes 4
  pageByKey[key] = pageObject
  keyByIndex.push key
  return key

changePageIndex = (key, newIndex) ->
  oldIndex = keyByIndex.indexOf key
  keyByIndex.splice(oldIndex, 1)
  keyByIndex.splice(newIndex, 0, key)

removeKey = (key) ->
  return null unless key in keyByIndex
  keyByIndex = keyByIndex.filter (each) -> key != each
  delete pageByKey[key]
  key

removeAllAfterKey = (key) ->
  result = []
  return result unless key in keyByIndex
  while keyByIndex[keyByIndex.length-1] != key
    unwanted = keyByIndex.pop()
    result.unshift unwanted
    delete pageByKey[unwanted]
  result

atKey = (key) ->
  pageByKey[key]

titleAtKey = (key) ->
  atKey(key).getTitle()

bestTitle = ->
  return "Wiki" unless keyByIndex.length
  titleAtKey keyByIndex[keyByIndex.length-1]


# Debug access to internal state used by unit tests.

debugKeys = ->
  keyByIndex

debugReset = ->
  pageByKey = {}
  keyByIndex = []


# Debug self-check which corrects misalignments until we get it right

debugSelfCheck = (keys) ->
  return if (have = "#{keyByIndex}") is (want = "#{keys}")
  console.log 'The lineup is out of sync with the dom.'
  console.log ".pages:", keys
  console.log "lineup:", keyByIndex
  return unless "#{Object.keys(keyByIndex).sort()}" is "#{Object.keys(keys).sort()}"
  console.log 'It looks like an ordering problem we can fix.'
  keysByIndex = keys


# Select a few crumbs from the lineup that will take us
# close to welcome-visitors on a (possibly) remote site.

leftKey = (key) ->
  pos = keyByIndex.indexOf key
  return null if pos < 1
  keyByIndex[pos-1]

crumbs = (key, location) ->
  page = pageByKey[key]
  host = page.getRemoteSite(location)
  result = ['view', slug = page.getSlug()]
  result.unshift('view', 'welcome-visitors') unless slug == 'welcome-visitors'
  if host != location and (left = leftKey key)?
    unless (adjacent = pageByKey[left]).isRemote()
      result.push(location, adjacent.getSlug())
  result.unshift(host)
  result


module.exports = {addPage, changePageIndex, removeKey, removeAllAfterKey, atKey, titleAtKey, bestTitle, debugKeys, debugReset, crumbs, debugSelfCheck}
