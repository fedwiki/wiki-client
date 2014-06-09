# handle drops of wiki pages or thing that go on wiki pages
# (we'll move decoding logic out of factory)

ifUrl = (event, handler) ->
  if (dt = event.originalEvent.dataTransfer)?
    if dt.types? and ('text/uri-list' in dt.types or 'text/x-moz-url' in dt.types)
      url = dt.getData 'URL'
      handler url if url?.length

ifPage = (url, handler) ->
  if found = url.match /^http:\/\/([a-zA-Z0-9:.-]+)(\/([a-zA-Z0-9:.-]+)\/([a-z0-9-]+(_rev\d+)?))+$/
    item = {}
    [ignore, origin, ignore, item.site, item.slug, ignore] = found
    item.site = origin if item.site in ['view','local','origin']
    handler item

dispatch = (handlers) ->
  (event) ->
    ifUrl event, (url) ->
      ifPage url, (page) ->
        if handlers.page?
          event.preventDefault()
          return handlers.page page

module.exports = {dispatch}