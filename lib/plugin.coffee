# The plugin module manages the dynamic retrieval of plugin
# javascript including additional scripts that may be requested.

# forward = require './forward'

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

plugin.renderFrom = (notifIndex) ->
  $items = $(".item").slice(notifIndex)
  
  # console.log "notifIndex", notifIndex, "about to render", $items.toArray()
  promise = Promise.resolve()
  emitNextItem = (itemElems) ->
    return promise if itemElems.length == 0
    itemElem = itemElems.shift()
    $item = $(itemElem)
    unless $item.hasClass('textEditing')
      item = $item.data('item')
      promise = promise.then ->
        return new Promise (resolve, reject) ->
          $item.off()
          plugin.emit $item.empty(), item, () ->
            resolve()
    emitNextItem(itemElems)
  # The concat here makes a copy since we need to loop through the same
  # items to do a bind.
  promise = emitNextItem $items.toArray()
  # Binds must be called sequentially in order to store the promises used to order bind operations.
  # Note: The bind promises used here are for ordering "bind creation".
  # The ordering of "bind results" is done within the plugin.bind wrapper.
  promise = promise.then ->
    promise = Promise.resolve()
    bindNextItem = (itemElems) ->
      return promise if itemElems.length == 0
      itemElem = itemElems.shift()
      $item = $(itemElem)
      item = $item.data('item')
      promise = promise.then ->
        return new Promise (resolve, reject) ->
          plugin.getPlugin item.type, (plugin) ->
            plugin.bind $item, item
            resolve()
      bindNextItem(itemElems)
    bindNextItem($items.toArray())
  return promise

emit = (pluginEmit) ->
  fn = ($item, item) ->
    $item.addClass('emit')
    pluginEmit($item, item)
  fn

bind = (name, pluginBind) ->
  fn = ($item, item, oldIndex) ->
    # Clear out any list of consumed items.
    $item[0].consuming = []
    index = $('.item').index($item)
    consumes = window.plugins[name].consumes
    waitFor = Promise.resolve()
    # Wait for all items in the lineup that produce what we consume
    # before calling our bind method.
    if consumes
      deps = []
      consumes.forEach (consuming) ->
        producers = $(".item:lt(#{index})").filter(consuming)
        # console.log(name, "consumes", consuming)
        # console.log(producers, "produce", consuming)
        if not producers or producers.length == 0
          console.log 'warn: no items in lineup that produces', consuming
        # console.log("there are #{producers.length} instances of #{consuming}")
        producers.each (_i, el) ->
          page_key = $(el).parents('.page').data('key')
          item_id = $(el).attr('data-id')
          $item[0].consuming.push("#{page_key}/#{item_id}")
          deps.push(el.promise)
      waitFor = Promise.all(deps)
    waitFor
      .then ->
        $item.removeClass('emit')
        bindPromise = pluginBind($item, item)
        if not bindPromise or typeof(bindPromise.then) == 'function'
          bindPromise = Promise.resolve(bindPromise)
        # This is where the "bind results" promise for the current item is stored
        $item[0].promise = bindPromise
      ### 
      .then ->
        # If the plugin has the needed callback, subscribe to server side events
        # for the current page
        if window.plugins[name].processServerEvent
          console.log 'listening for server events', $item, item
          forward.init $item, item, window.plugins[name].processServerEvent 
      ###
      .catch (e) ->
        console.log 'plugin emit: unexpected error', e
  return fn

plugin.wrap = (name, p) ->
  p.emit = emit(p.emit)
  p.bind = bind(name, p.bind)
  return p

plugin.get = plugin.getPlugin = (name, callback) ->
  if window.pluginSuccessor[name]
    wiki.log('plugin successor', name, window.pluginSuccessor[name])
    name = window.pluginSuccessor[name] 
  return loadingScripts[name].then(callback) if loadingScripts[name]
  loadingScripts[name] = new Promise (resolve, _reject) ->
    return resolve(window.plugins[name]) if window.plugins[name]
    getScript "/plugins/#{name}/#{name}.js", () ->
      p = window.plugins[name]
      if p
        plugin.wrap(name, p)
        return resolve(p)
      getScript "/plugins/#{name}.js", () ->
        p = window.plugins[name]
        plugin.wrap(name, p) if p
        return resolve(p)
  loadingScripts[name].then (plugin) ->
    delete loadingScripts[name]
    return callback(plugin)
  return loadingScripts[name]


plugin.do = plugin.doPlugin = ($item, item, done=->) ->
  $item.data('item', item)
  promise = plugin.renderFrom $('.item').index($item)
  promise.then ->
    done()

plugin.emit = (div, item, done=->) ->
  error = (ex, script) ->
    div.append """
      <div class="error">
        #{escape item.text || ""}
        <button>help</button><br>
      </div>
    """
    if item.text?
      div.find('.error').on 'dblclick', (e) ->
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
            done()
        else
          script.emit div, item
          done()

  div.data 'pageElement', div.parents(".page")
  div.data 'item', item
  plugin.get item.type, (script) ->
    try
      throw TypeError("Can't find plugin for '#{item.type}'") unless script?
      if script.emit.length > 2
        script.emit div, item, ->
          script.bind div, item if bind
          done()
      else
        script.emit div, item
        done()
    catch err
      console.log 'plugin error', err
      error(err, script)
      done()

plugin.registerPlugin = (pluginName,pluginFn)->
  window.plugins[pluginName] = pluginFn($)
