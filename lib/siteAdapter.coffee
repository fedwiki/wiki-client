# The siteAdapter handles fetching resources from sites, including origin
# and local browser storage.

module.exports = siteAdapter = {}

# we save the site prefix once we have determined it...
sitePrefix = {}

# when asked for a site's flag, if we don't know the current prefix we create
# a temporary greyscale flag. We save them here, so we can replace them when
# we know how to get a site's flag
tempFlags = {}

createTempFlag = (site) ->
  console.log "creating temp flags for #{site}"
  myCanvas = document.createElement('canvas')
  myCanvas.width = 32
  myCanvas.height = 32

  ctx = myCanvas.getContext('2d')

  x1 = Math.random() * 32
  y1 = x1
  y2 = Math.random() * 32
  x2 = 32 - y2

  c1 = (Math.random() * 0xFF<<0).toString(16)
  c2 = (Math.random() * 0xFF<<0).toString(16)

  color1 = '#' + c1 + c1 + c1
  color2 = '#' + c2 + c2 + c2


  gradient = ctx.createRadialGradient(x1,y1,32,x2,y2,0)
  gradient.addColorStop(0, color1)
  gradient.addColorStop(1, color2)
  ctx.fillStyle = gradient
  ctx.fillRect(0,0,32,32)
  myCanvas.toDataURL()

siteAdapter.local = {
  flag: -> "/favicon.png?adapted"
  get: (route, done) ->
    console.log "wiki.local.get #{route}"
    if page = localStorage.getItem(route.replace(/\.json$/,''))
      done null, JSON.parse page
    else
      done {msg: "no page named '#{route}' in browser local storage"}
}

siteAdapter.origin = {
  flag: -> "/favicon.png?adapted"
  get: (route, done) ->
    console.log "wiki.origin.get #{route}"
    $.ajax
      type: 'GET'
      dataType: 'json'
      url: "/#{route}?adapted"
      success: (page) -> done null, page
      error: (xhr, type, msg) -> done {msg, xhr}, null
}

siteAdapter.site = (site) ->
  return siteAdapter.origin if !site or site is window.location.host

  flag: ->
    console.log "wiki.site(#{site}.flag)"
    if sitePrefix[site]?
      # we already know how to construct flag url
      console.log "wiki.site(#{site}).flag - sitePrefix[site]"
      sitePrefix[site] + "favicon.png?adapted"
    else if tempFlags[site]?
      # we already have a temp. flag
      console.log "wiki.site(#{site}).flag - have temp. flag"
      tempFlags[site]
    else
      # we don't know the url to the real flag, or have a temp flag
      #findPrefix site, (prefix) ->
      #  console.log "Prefix for #{site} is #{prefix}"

      # create a temp flag, save it for reuse, and return it
      tempFlag = createTempFlag(site)
      tempFlags[site] = tempFlag
      tempFlag

  get: (route, cb) ->
