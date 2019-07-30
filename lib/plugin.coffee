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
  options = $.extend(options or {},
    dataType: "script"
    cache: true
    url: url
  )
  $.ajax options

scripts = []
loadingScripts = {}
getScript = plugin.getScript = (url, callback = () ->) ->
  # console.log "URL :", url, "\nCallback :", callback
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

plugin.get = plugin.getPlugin = (name, callback) ->
  return loadingScripts[name].then(callback) if loadingScripts[name]
  loadingScripts[name] = new Promise (resolve, _reject) ->
    return resolve(window.plugins[name]) if window.plugins[name]
    getScript "/plugins/#{name}/#{name}.js", () ->
      p = window.plugins[name]
      return resolve(p) if p
      getScript "/plugins/#{name}.js", () ->
        p = window.plugins[name]
        return resolve(p)
  loadingScripts[name].then (plugin) ->
    delete loadingScripts[name]
    return callback(plugin)
  return loadingScripts[name]

plugin.do = plugin.doPlugin = (div, item, done=->) ->
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
            script.bind div, item
            done()
        else
          script.emit div, item
          script.bind div, item
          done()

  div.data 'pageElement', div.parents(".page")
  div.data 'item', item
  plugin.get item.type, (script) ->
    try
      throw TypeError("Can't find plugin for '#{item.type}'") unless script?
      if script.emit.length > 2
        script.emit div, item, ->
          script.bind div, item
          done()
      else
        script.emit div, item
        script.bind div, item
        done()
    catch err
      console.log 'plugin error', err
      error(err, script)
      done()

plugin.registerPlugin = (pluginName,pluginFn)->
  window.plugins[pluginName] = pluginFn($)
