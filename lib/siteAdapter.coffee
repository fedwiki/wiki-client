# The siteAdapter handles fetching resources from remote sites, including the
# origin. It contains logic to check the correct protocol is used.

module.exports = siteAdapter = {}

# we'll use jquery for get and assume all gets are json
# a site adapter need not use this helper if it has a better way

get = (url, done) ->
  $.ajax
    type: 'GET'
    dataType: 'json'
    url: url
    success: (data) -> done null, data
    error: (xhr, type, msg) -> done {msg, xhr}, null

put = (url, data, done) ->
  $.ajax
    type: 'PUT'
    dataType: 'json'
    url: url
    processData: false
    data: data
    contentType: 'application/json'
    success: (page) -> done null, page
    error: (xhr, type, msg) -> done {msg, xhr}, null

# we provide instant access to well known adapters where
# there is no indecision as to how to address resources

siteAdapter.local = {
  url: (route) -> "/#{route}?adapted"
  get: (route, done) ->
    console.log 'wiki.local.get',route
    if page = localStorage.getItem(route.replace(/\.json$/,''))
      done null, JSON.parse page
    else
      done {msg: "no page named '#{route}' in browser local storage"}, null
  put: (route, data, done) ->
    # to be determined
}

siteAdapter.origin = {
  url: (route) -> "/#{route}?adapted"
  get: (route, done) -> get this.url(route), done
  put: (route, data, done) -> # to be determined
}

# we provide alternatives that will be chosen and saved
# for each remote site we encounter in the federation

direct = (site) ->
  url: (route) -> "//#{site}/#{route}?adapted"
  get: (route, done) -> get this.url(route), done

proxy = (site) ->
  url: (route) -> "/proxy/#{site}/#{route}?adapted"
  get: (route, done) -> get this.url(route), done

# we can test whether a site supports ssl or not
# for now we just delay a few milliseconds to simulate async logic
# we return a temporary adapter for use while this test is in progress

testForSSL = (site, done) ->
  ding = -> done false
  setTimmer ding, 200

discover = (site) ->
  testForSSL site, (ssl) ->
    if ssl
      adapter[site] = direct(site)
      # rewrite dom objects to direct
    else
      adapter[site] = proxy(site)
      # rewrite dom object to proxy
  url: (route) -> "/proxy/#{site}/#{route}?adapted"
  get: (route, done) -> get this.url(route), done

# here is logic we use to dynamically choose an adapter
# for a remote site. Our strategy depends on the protocol
# in use by the origin with useful defaults for testing

adapters = {}

host = window?.location.host || 'localhost'
adapters[host] = siteAdapter.origin

factory = switch window?.location.protocol || 'http:'
  when 'http:' then direct
  when 'https:' then discover

siteAdapter.site = (site) ->
  return adapters[site||host] || adapters[site] = factory(site)
