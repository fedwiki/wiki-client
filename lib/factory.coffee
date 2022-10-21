# A Factory plugin provides a drop zone for desktop content
# destined to be one or another kind of item. Double click
# will turn it into a normal paragraph.

neighborhood = require './neighborhood'
plugin = require './plugin'
resolve = require './resolve'
pageHandler = require './pageHandler'
editor = require './editor'
synopsis = require './synopsis'
drop = require './drop'
active = require './active'

escape = (line) ->
  line
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')


emit = ($item, item) ->
  $item.append '<p>Double-Click to Edit<br>Drop Text or Image to Insert</p>'

  showMenu = ->
    menu = $item.find('p').append """
      <br>Or Choose a Plugin
      <center>
      <table style="text-align:left;">
      <tr><td><ul id=format><td><ul id=data><td><ul id=other>
    """
    for info in window.catalog
      if info and info.category
        column = info.category
        column = 'other' unless column in ['format', 'data']
        menu.find('#'+column).append """
          <li><a class="menu" href="#" title="#{info.title}">#{info.name}</a></li>
        """
    menu.find('a.menu').on 'click', (evt)->
      pluginName = evt.target.text
      pluginType = pluginName.toLowerCase()
      $item.removeClass('factory').addClass(item.type=pluginType)
      $item.off()
      evt.preventDefault()
      active.set $item.parents(".page")
      catalogEntry = window.catalog.find((entry) -> pluginName is entry.name)
      if catalogEntry.editor
        try
          window.plugins[pluginType].editor $item, item
        catch error
          console.log("#{pluginName} Plugin editor failed: #{error}. Falling back to textEditor")
          editor.textEditor($item, item)
      else
        editor.textEditor $item, item

  showPrompt = ->
    $item.append "<p>#{resolve.resolveLinks(item.prompt, escape)}</b>"

  if item.prompt
    showPrompt()
  else if window.catalog?
    showMenu()
  else
    wiki.origin.get 'system/factories.json', (error, data) ->
      # console.log 'factory', data
      window.catalog = data
      showMenu()

bind = ($item, item) ->

  syncEditAction = ->
    $item.empty().off()
    $item.removeClass("factory").addClass(item.type)
    $page = $item.parents('.page:first')
    try
      $item.data 'pageElement', $page
      $item.data 'item', item
      plugin.getPlugin item.type, (plugin) ->
        plugin.emit $item, item
        plugin.bind $item, item
    catch err
      $item.append "<p class='error'>#{err}</p>"
    pageHandler.put $page, {type: 'edit', id: item.id, item: item}

  punt = (data) ->
    item.prompt = "Unexpected Item\nWe can't make sense of the drop.\nTry something else or see [[About Factory Plugin]]."
    data.userAgent = navigator.userAgent
    item.punt = data
    syncEditAction()

  addReference = (data) ->
    wiki.site(data.site).get "#{data.slug}.json", (err, remote) ->
      if !err
        item.type = 'reference'
        item.site = data.site
        item.slug = data.slug
        item.title = remote.title || data.slug
        item.text = synopsis remote
        syncEditAction()
        neighborhood.registerNeighbor item.site if item.site?

  addVideo = (video) ->
    item.type = 'video'
    item.text = "#{video.text}\n(double-click to edit caption)\n"
    syncEditAction()

  addRemoteImage = (url) ->
    # give some feedback, in case this is going to take a while...
    document.documentElement.style.cursor = 'wait'

    fetch(url)
      .then (response) ->
        if response.ok
          return response.blob()
        throw new Error('Unable to fetch image')
      .then (imageBlob) ->
        imageFileName = url.split('/').pop().split('#')[0].split('?')[0]
        # not sure if converting to file gives anything!
        # imageFile = new File([imageBlob], imageFileName, { type: imageBlob.type })
        reader = new FileReader()
        reader.readAsDataURL(imageBlob)
        reader.onload = (loadEvent) ->
          imageDataURL = loadEvent.target.result
          window.plugins['image'].editor({ imageDataURL, filename: imageFileName, imageSourceURL: url, imageCaption: "Remote image [#{url} source]", $item, item })


  addRemoteSvg = (url) ->
    document.documentElement.style.cursor = 'wait'
    fetch(url)
    .then (response) ->
      if response.ok
        return response
      throw new Error('Unable to fetch svg')
    .then (response) ->
      return response.text()
    .then (svgText) ->
      document.documentElement.style.cursor = 'default'
      item.type = 'html'
      item.source = url
      item.text = svgText + "<p>[#{url} Source]</p>"
      syncEditAction()
      
      

  readFile = (file) ->
    if file?
      [majorType, minorType] = file.type.split("/")
      reader = new FileReader()
      if majorType == "image"
        # svg -> html plugin
        if minorType.startsWith('svg')
          reader.onload = (loadEvent) ->
            result = loadEvent.target.result
            item.type = 'html'
            item.text = result
            syncEditAction()
          reader.readAsText(file)
        else
          reader.onload = (loadEvent) ->
            # console.log('upload file', file)
            imageDataURL = loadEvent.target.result
            window.plugins['image'].editor({ imageDataURL, filename: file.name, imageCaption: "Uploaded image" , $item, item})
          reader.readAsDataURL(file)
      else if majorType == "text"
        reader.onload = (loadEvent) ->
          result = loadEvent.target.result
          if minorType == 'csv'
            item.type = 'data'
            item.columns = (array = csvToArray result)[0]
            item.data = arrayToJson array
            item.text = file.fileName
          else
            item.type = 'paragraph'
            item.text = result
          syncEditAction()
        reader.readAsText(file)
      else
        punt
          name: file.name
          type: file.type
          size: file.size
          fileName: file.fileName
          lastModified: file.lastModified

  $item.on 'dblclick', (e) ->
    
    return unless $('.editEnable').is(':visible')

    if e.shiftKey
      editor.textEditor $item, item, {field: 'prompt'}
    else
      $item.removeClass('factory').addClass(item.type = 'paragraph')
      $item.off()
      editor.textEditor $item, item

  $item.on 'dragenter', (evt) -> evt.preventDefault()
  $item.on 'dragover', (evt) -> evt.preventDefault()
  $item.on "drop", drop.dispatch
    page: addReference
    file: readFile
    video: addVideo
    image: addRemoteImage
    svg: addRemoteSvg
    punt: punt

# from http://www.bennadel.com/blog/1504-Ask-Ben-Parsing-CSV-Strings-With-Javascript-Exec-Regular-Expression-Command.htm
# via http://stackoverflow.com/questions/1293147/javascript-code-to-parse-csv-data

csvToArray = (strData, strDelimiter) ->
  strDelimiter = (strDelimiter or ",")
  objPattern = new RegExp(("(\\" + strDelimiter + "|\\r?\\n|\\r|^)" + "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" + "([^\"\\" + strDelimiter + "\\r\\n]*))"), "gi")
  arrData = [ [] ]
  arrMatches = null
  while arrMatches = objPattern.exec(strData)
    strMatchedDelimiter = arrMatches[1]
    arrData.push []  if strMatchedDelimiter.length and (strMatchedDelimiter isnt strDelimiter)
    if arrMatches[2]
      strMatchedValue = arrMatches[2].replace(new RegExp("\"\"", "g"), "\"")
    else
      strMatchedValue = arrMatches[3]
    arrData[arrData.length - 1].push strMatchedValue
  arrData

arrayToJson = (array) ->
  cols = array.shift()
  rowToObject = (row) ->
    obj = {}
    for [k, v] in _.zip(cols, row)
      obj[k] = v if v? && (v.match /\S/) && v != 'NULL'
    obj
  (rowToObject row for row in array)


module.exports = {emit, bind}
