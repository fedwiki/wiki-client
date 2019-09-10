# The plugin module manages the dynamic retrieval of plugin
# javascript including additional scripts that may be requested.

module.exports = plugin = {}

escape = (s) ->
  (''+s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g,'&#x2F;')

# define loadScript that allows fetching a script.
# see example in http://api.jquery.com/jQuery.getScript/

loadScript = (url, options) ->
  console.log("loading url:", url)
  options = $.extend(options or {},
    dataType: "script"
    cache: true
    url: url
  )
  $.ajax options

scripts = []
loadingScripts = {}
getScript = plugin.getScript = (url, callback = () ->) ->
  if url in scripts
    callback()
  else
    loadScript url
      .done ->
        scripts.push url
        callback()
      .fail (_jqXHR, _textStatus, err) ->
        console.log('getScript: Failed to load:', url, err)
        callback()

# Consumes is a map
pluginsThatConsume = (capability) ->
  Object.keys(window.plugins)
    .filter (plugin) -> window.plugins[plugin].consumes
    .filter (plugin) -> window.plugins[plugin].consumes.indexOf(capability) != -1

plugin.produces = ($item) ->
  produces = $item[0].className.split(" ")
    .filter (c) -> c.indexOf("-source") != -1
    .map (c) -> "." + c
  return produces

plugin.notifyConsumers = (name, produces, notifIndex) ->
  return if produces.length == 0
  produces.forEach (producer) ->
    tonotify = pluginsThatConsume(producer)
    console.log(producer, "is consumed by", tonotify)
    tonotify.forEach (name) ->
      instances = $(".item:gt(#{notifIndex-1})").filter("." + name)
      console.log("there are #{instances.length} instances of #{name} beyond index #{notifIndex-1}")
      instances.each (_i, consumer) ->
        $consumer = $(consumer)
        plugin.do $consumer.empty(), $consumer.data("item")

bind = (name, pluginBind) ->
  fn = ($item, item, oldIndex) ->
    index = $('.item').index($item)
    notifIndex = oldIndex
    notifIndex = index if not oldIndex or index < oldIndex
    consumes = window.plugins[name].consumes
    waitFor = Promise.resolve()
    # Wait for all items in the lineup that produce what we consume
    # before calling our bind method.
    if consumes
      deps = []
      consumes.forEach (consuming) ->
        producers = $(".item:lt(#{index})").filter(consuming)
        console.log(name, "consumes", consuming)
        console.log(producers, "produce", consuming)
        if not producers or producers.length == 0
          console.log 'warn: no items in lineup that produces', consuming
        console.log("there are #{producers.length} instances of #{consuming}")
        producers.each (_i, el) ->
          console.log("promise: ", el, el.promise)
          deps.push(el.promise)
      console.log("waiting for:", deps)
      waitFor = Promise.all(deps)
    waitFor
      .then ->
        console.log("getting promise for", name)
        bindPromise = pluginBind($item, item)
        if not bindPromise or typeof(bindPromise.then) == 'function'
          bindPromise = Promise.resolve(bindPromise)
        $item[0].promise = bindPromise
        console.log("promise bound for", name)
      # After we bind, notify everyone that depends on us to reload
      .then ->
        produces = plugin.produces($item)
        plugin.notifyConsumers(name, produces, notifIndex)
      .catch (e) ->
        console.log 'plugin emit: unexpected error', e
  return fn

plugin.get = plugin.getPlugin = (name, callback) ->
  return loadingScripts[name].then(callback) if loadingScripts[name]
  loadingScripts[name] = new Promise (resolve, _reject) ->
    return resolve(window.plugins[name]) if window.plugins[name]
    getScript "/plugins/#{name}/#{name}.js", () ->
      p = window.plugins[name]
      if p
        p.bind = bind(name, p.bind)
        return resolve(p)
      getScript "/plugins/#{name}.js", () ->
        p = window.plugins[name]
        p.bind = bind(name, p.bind) if p
        return resolve(p)
  loadingScripts[name].then (plugin) ->
    delete loadingScripts[name]
    return callback(plugin)
  return loadingScripts[name]


plugin.do = plugin.doPlugin = (div, item, done=->, originalIndex) ->
  plugin.emit div, item, {done, originalIndex, bind: true}

plugin.emit = (div, item, {done=->, originalIndex, bind=false}) ->
  error = (ex, script) ->
    div.append """
      <div class="error">
        #{escape item.text || ""}
        <button>help</button><br>
      </div>
    """
    if item.text?
      div.find('.error').dblclick (e) ->
        wiki.textEditor div, item
    div.find('button').on 'click', ->
      wiki.dialog ex.toString(), """
        <p> This "#{item.type}" plugin won't show.</p>
        <li> Is it available on this server?
        <li> Is its markup correct?
        <li> Can it find necessary data?
        <li> Has network access been interrupted?
        <li> Has its code been tested?
        <p> Developers may open debugging tools and retry the plugin.</p>
        <button class="retry">retry</button>
        <p> Learn more
          <a class="external" target="_blank" rel="nofollow"
          href="http://plugins.fed.wiki.org/about-plugins.html"
          title="http://plugins.fed.wiki.org/about-plugins.html">
            About Plugins
            <img src="/images/external-link-ltr-icon.png">
          </a>
        </p>
      """
      $('.retry').on 'click', ->
        if script.emit.length > 2
          script.emit div, item, ->
            script.bind div, item, originalIndex if bind
            done()
        else
          script.emit div, item
          script.bind div, item, originalIndex if bind
          done()

  div.data 'pageElement', div.parents(".page")
  div.data 'item', item
  plugin.get item.type, (script) ->
    try
      throw TypeError("Can't find plugin for '#{item.type}'") unless script?
      if script.emit.length > 2
        script.emit div, item, ->
          script.bind div, item, originalIndex if bind
          done()
      else
        script.emit div, item
        script.bind div, item, originalIndex if bind
        done()
    catch err
      console.log 'plugin error', err
      error(err, script)
      done()

plugin.registerPlugin = (pluginName,pluginFn)->
  window.plugins[pluginName] = pluginFn($)
