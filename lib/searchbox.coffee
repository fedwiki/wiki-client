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