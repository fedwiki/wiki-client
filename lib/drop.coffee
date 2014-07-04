# handle drops of wiki pages or thing that go on wiki pages
# (we'll move decoding logic out of factory)

isFile = (event) ->
  if (dt = event.originalEvent.dataTransfer)?
    if 'Files' in dt.types
      return dt.files[0]
  null

isUrl = (event) ->
  if (dt = event.originalEvent.dataTransfer)?
    if dt.types? and ('text/uri-list' in dt.types or 'text/x-moz-url' in dt.types)
      url = dt.getData 'URL'
      return url if url?.length
  null

isPage = (url) ->
  if found = url.match /^http:\/\/([a-zA-Z0-9:.-]+)(\/([a-zA-Z0-9:.-]+)\/([a-z0-9-]+(_rev\d+)?))+$/
    item = {}
    [ignore, origin, ignore, item.site, item.slug, ignore] = found
    item.site = origin if item.site in ['view','local','origin']
    return item
  null

dispatch = (handlers) ->
  (event) ->
    stop = (ignored) ->
      event.preventDefault()
      event.stopPropagation()
    if url = isUrl event
      if page = isPage url
        if (handle = handlers.page)?
          return stop handle page
      punt = {url}
    if file = isFile event
      if (handle = handlers.file)?
        return stop handle file
      punt = {file}
    if (handle = handlers.punt)?
      punt ||= {dt:event.dataTransfer, types:event.dataTransfer?.types}
      stop handle punt


module.exports = {dispatch}