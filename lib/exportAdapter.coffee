# this adapter will read pages from an export file
# hosted on a read only web server


module.exports = exportAdapter = {}


get = (urlx, done) ->
  $.ajax
    type: 'GET'
    dataType: 'json'
    url: urlx
    contentType: 'application/json'
    success: (data) -> done null, data
    error: (xhr, type, msg) -> done {msg, xhr}, null


exportAdapter.file = (loc) ->

  url: (route) ->
    switch route
      when 'favicon.png' then '/favicon.png'

  get: (route, done) ->
    get loc, (err, pages) ->
      if m = route.match /([a-z0-9-]\/).json/
        done null, pages[m[1]]

