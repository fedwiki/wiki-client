# The siteAdapter handles fetching resources from remote sites, including the
# origin. It contains logic to check the correct protocol is used.

# for sites we have already determined the correct prefix for the
# requests, we will store them here keyed by site.
sitePrefix = {}

tryURL = (site) ->
  tryURL: (url, done) ->

    console.log "tryURL #{url}"
    this.inuse = true
    this.callback = done
    _that = this
    this.img = new Image()
    this.img.onload = () ->
      _that.inuse = false
      _that.callback(true)
    this.img.onerror = (e) ->
      if _that.inuse
        console.log "tryURL onerror", e
        _that.inuse = false
        _that.callback(false)
    this.start = new Date().getTime()
    this.img.src = url
    this.timer = setTimeout( () ->
      if _that.inUse
        console.log "tryURL #{url} - timeout"
        _that.inUse = false
        _that.callback(false)
    , 1500)



local = {
  url: (route) ->
    "/#{route}?adapted"
  getURL: (route, done) ->
    done "/#{route}?adapted"
  get: (route, done) ->
    console.log 'wiki.local.get',route
    if page = localStorage.getItem(route.replace(/\.json$/,''))
      done null, JSON.parse page
    else
      done {msg: "no page named '#{route}' in browser local storage"}, null
}

origin = {
  url: (route) ->
    "/#{route}?adapted"
  getURL: (route, done) ->
    console.log "siteadapter origin getURL #{route}"
    done "/#{route}?adapted"
  get: (route, done) ->
    console.log 'wiki.origin.get',route
    $.ajax
      type: 'GET'
      dataType: 'json'
      url: this.url(route)
      success: (page) -> done null, page
      error: (xhr, type, msg) -> done {msg, xhr}, null
}

site = (site) ->
  return origin if !site or site is window.location.host
  {
    url: (route) ->
      if sitePrefix[site]?
        console.log "url - prefix ", sitePrefix[site]
        "#{sitePrefix[site]}#{route}?adapted"
      else
        "//#{site}/#{route}?adapted"
    getURL: (route, done) ->
      console.log "siteAdapter getURL #{site}, #{route}"
      if sitePrefix[site]?
        console.log "getURL#{site} - prefix ", sitePrefix[site]
        done "#{sitePrefix[site]}#{route}?adapted"

      console.log "wiki.site(#{site}).getURL", route
      testURL = location.protocol + "//#{site}/favicon.png"
      tryURL(site).tryURL testURL, (worked) ->
        if worked
          sitePrefix[site] = "//#{site}/"
          console.log "getURL  -  //#{site}/#{route}?adapted"
          done "//#{site}/#{route}?adapted"
        else
          switch location.protocol
            when 'http:'
              testURL = "https://#{site}/favicon.png"
              tryURL(site).tryURL testURL, (worked) ->
                if worked
                  sitePrefix[site] = "https://#{site}/"
                  console.log "getURL  -  https://#{site}/#{route}?adapted"
                  done "https://#{site}/#{route}?adapted"
                else
                  sitePrefix[site] = "//#{site}/"
                  console.log "getURL  -  //#{site}/#{route}?adapted"
                  done "//#{site}/#{route}?adapted"
            when 'https:'
              testURL = "/proxy/#{site}/favicon.png"
              tryURL(site).tryURL testURL, (worked) ->
                if worked
                  sitePrefix[site] = "/proxy/#{site}/"
                  console.log "getURL  -  /proxy/#{site}/#{route}?adapted"
                  done "/proxy/#{site}/#{route}?adapted"
                else
                  sitePrefix[site] = "//#{site}/"
                  console.log "getURL  -  //#{site}/#{route}?adapted"
                  done "//#{site}/#{route}?adapted"
            else
              console.log "getURL #{site} - unavailable"
              sitePrefix[site] = "//#{site}/"
              console.log "getURL  -  //#{site}/#{route}?adapted"
              done "//#{site}/#{route}?adapted"
    get: (route, cb) ->
      this.getURL route, (myURL) ->
        console.log "wiki.site(#{site}).get",route, myURL
        $.ajax
          type: 'GET'
          dataType: 'json'
          url: myURL
          success: (page) -> cb null, page
          error: (xhr, type, msg) -> cb {msg, xhr}, null
}

module.exports = {local, origin, site}
