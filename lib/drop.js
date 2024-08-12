# handle drops of wiki pages or thing that go on wiki pages
# (we'll move decoding logic out of factory)

nurl = require 'url'

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
  if found = url.match /^https?:\/\/([a-zA-Z0-9:.-]+)(\/([a-zA-Z0-9:.-]+)\/([a-z0-9-]+(_rev\d+)?))+$/
    item = {}
    [ignore, origin, ignore, item.site, item.slug, ignore] = found
    item.site = origin if item.site in ['view','local','origin']
    return item
  null

isImage = (url) ->
  parsedURL = nurl.parse(url, true, true)
  if parsedURL.pathname.match(/\.(jpg|jpeg|png)$/i)
    return url
  null

isSvg = (url) ->
  parsedURL = nurl.parse(url, true, true)
  if parsedURL.pathname.match(/\.(svg)$/i)
    return url
  null

isVideo = (url) ->
  parsedURL = nurl.parse(url, true, true)
  # check if video dragged from search (Google)
  try
    if parsedURL.query.source is 'video'
      parsedURL = nurl.parse(parsedURL.query.url, true, true)
  catch error


  switch parsedURL.hostname
    when "www.youtube.com"
      if parsedURL.query.list?
        return {text: "YOUTUBE PLAYLIST #{parsedURL.query.list}"}
      else
        return {text: "YOUTUBE #{parsedURL.query.v}"}
    when "youtu.be"  # should redirect to www.youtube.com, but...
      if parsedURL.query.list?
        return {text: "YOUTUBE PLAYLIST #{parsedURL.query.list}"}
      else
        return {text: "YOUTUBE #{parsedURL.pathname.substr(1)}"}
    when "vimeo.com"
      return {text: "VIMEO #{parsedURL.pathname.substr(1)}"}
    when "archive.org"
      return {text: "ARCHIVE #{parsedURL.pathname.substr(parsedURL.pathname.lastIndexOf('/') + 1)}"}
    when "tedxtalks.ted.com"
      return {text: "TEDX #{parsedURL.pathname.substr(parsedURL.pathname.lastIndexOf('/') + 1)}"}
    when "www.ted.com"
      return {text: "TED #{parsedURL.pathname.substr(parsedURL.pathname.lastIndexOf('/') + 1)}"}
    else
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
      if video = isVideo url
        if (handle = handlers.video)?
          return stop handle video
      if image = isImage url
        if (handle = handlers.image)?
          return stop handle image
      if svg = isSvg url
        if (handle = handlers.svg)?
          return stop handle svg
      punt = {url}
    if file = isFile event
      if (handle = handlers.file)?
        return stop handle file
      punt = {file}
    if (handle = handlers.punt)?
      punt ||= {dt:event.dataTransfer, types:event.dataTransfer?.types}
      stop handle punt


module.exports = {dispatch}
