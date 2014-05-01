# The plugin module manages the dynamic retrieval of plugin
# javascript including additional scripts that may be requested.

module.exports = plugin = {}

# define cachedScript that allows fetching a cached script.
# see example in http://api.jquery.com/jQuery.getScript/ 

cachedScript = (url, options) ->
  options = $.extend(options or {},
    dataType: "script"
    cache: true
    url: url
  )
  $.ajax options

scripts = []
getScript = plugin.getScript = (url, callback = () ->) ->
  # console.log "URL :", url, "\nCallback :", callback
  if url in scripts
    callback()
  else 
    cachedScript(url)
      .done ->
        scripts.push url
        callback()
      .fail ->
        callback()

plugin.get = plugin.getPlugin = (name, callback) ->
  return callback(window.plugins[name]) if window.plugins[name]
  getScript "/plugins/#{name}/#{name}.js", () ->
    return callback(window.plugins[name]) if window.plugins[name]
    getScript "/plugins/#{name}.js", () ->
      callback(window.plugins[name])

plugin.do = plugin.doPlugin = (div, item, done=->) ->
  error = (ex) ->
    errorElement = $("<div />").addClass('error')
    errorElement.text(ex.toString())
    div.append(errorElement)

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
      error(err)
      done()

plugin.registerPlugin = (pluginName,pluginFn)->
  window.plugins[pluginName] = pluginFn($)


