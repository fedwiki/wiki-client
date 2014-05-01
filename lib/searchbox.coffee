# Handle input events from the search box. There is machinery
# here that anticipates incremental search that is yet to be coded.
# We use dependency injection to break dependency loops.

createSearch = require './search'

search = null

inject = (neighborhood) ->
  search = createSearch({neighborhood})

bind = ->
  $('input.search').on 'keypress', (e)->
    return if e.keyCode != 13 # 13 == return
    searchQuery = $(this).val()
    search.performSearch( searchQuery )
    $(this).val("")

module.exports = {inject, bind}