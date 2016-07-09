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
      column = info.category || 'other'
      column = 'other' unless column in ['format', 'data']
      menu.find('#'+column).append """
        <li><a class="menu" href="#" title="#{info.title}">#{info.name}</a></li>
      """
    menu.find('a.menu').click (evt)->
      $item.removeClass('factory').addClass(item.type=evt.target.text.toLowerCase())
      $item.unbind()
      evt.preventDefault()
      active.set $item.parents(".page")
      editor.textEditor $item, item

  showPrompt = ->
    $item.append "<p>#{resolve.resolveLinks(item.prompt, escape)}</b>"

  if item.prompt
    showPrompt()
  else if window.catalog?
    showMenu()
  else
    $.getJSON '/system/factories.json', (data) ->
      window.catalog = data
      showMenu()

bind = ($item, item) ->

  syncEditAction = ->
    $item.empty().unbind()
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
    $.getJSON "http://#{data.site}/#{data.slug}.json", (remote) ->
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

  readFile = (file) ->
    if file?
      [majorType, minorType] = file.type.split("/")
      reader = new FileReader()
      if majorType == "image"
        reader.onload = (loadEvent) ->
          item.type = 'image'
          item.url = resizeImage loadEvent.target.result
          item.caption ||= "Uploaded image"
          syncEditAction()
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

  $item.dblclick (e) ->
    if e.shiftKey
      editor.textEditor $item, item, {field: 'prompt'}
    else
      $item.removeClass('factory').addClass(item.type = 'paragraph')
      $item.unbind()
      editor.textEditor $item, item

  $item.bind 'dragenter', (evt) -> evt.preventDefault()
  $item.bind 'dragover', (evt) -> evt.preventDefault()
  $item.bind "drop", drop.dispatch
    page: addReference
    file: readFile
    video: addVideo
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

# from http://www.benknowscode.com/2014/01/resizing-images-in-browser-using-canvas.html
# Patrick Oswald version from comment, coffeescript and further simplification for wiki

resizeImage = (dataURL) ->
  smallEnough = (src) ->
    src.width <= 500 || src.height <= 300
  squeezeSteps = (src) ->
    return src if smallEnough src
    canvas = document.createElement 'canvas'
    canvas.width = cW = src.width / 2
    canvas.height = cH = src.height / 2
    context = canvas.getContext '2d'
    context.drawImage src, 0, 0, cW, cH
    return squeezeSteps canvas
  img = new Image
  img.src = dataURL
  return dataURL if smallEnough img
  squeezeSteps(img).toDataURL 'image/jpeg', .5  # medium quality encoding

module.exports = {emit, bind}
