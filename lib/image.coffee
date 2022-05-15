# An Image plugin presents a picture with a caption. The image source
# can be any URL but we have been using "data urls" so as to get the
# proper sharing semantics if not storage efficency.

plugin = require './plugin'
dialog = require './dialog'
pageHandler = require './pageHandler'
resolve = require './resolve'
link = require './link'

ipfs = false
ipfs_probed = false

probe_ipfs = () ->
  ipfs_probed = true
  gateway = "http://127.0.0.1:8080"
  $.ajax "#{gateway}/ipfs/Qmb1oS3TaS8vekxXqogoYsixe47sXcVxQ22kPWH8VSd7yQ",
    timeout: 30000
    success: (data) -> ipfs = data == "wiki\n"
    complete: (xhr, status) -> console.log "ipfs gateway #{status}"

emit = ($item, item) ->
  item.text ||= item.caption
  $item.addClass(item.size or 'thumbnail')
  $item.append "<img class='#{item.size or 'thumbnail'}' src='#{item.url}'> <p>#{resolve.resolveLinks(item.text)}</p>" 

bind = ($item, item) ->
  # This only really works once the images have been rendered, so we know where we are...
  if $item.hasClass('thumbnail')
    if $item.offset().left - $item.parent().offset().left < 200
      $item.addClass('left') 

  $item.dblclick ->
    editor({ $item, item })

  if (item.ipfs and not ipfs_probed)
    probe_ipfs()

  $item.find('img').dblclick (event) ->
    event.stopPropagation()
    url = if ipfs and item.ipfs?
      "#{gateway}/ipfs/#{item.ipfs}"
    else if item.source?
      # somehow test for continued existnace? Maybe register an error handler?
      item.source
    else
      item.url
    dialog.open item.text, """<img style="width:100%" src="#{url}">"""

editor = (spec) ->

  escape = (string) ->
    string
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

  imageSize = (dataURL) ->
    img = new Image()
    img.src = dataURL
    img.decode()
      .then () ->
        if img.width > 415
          return "wide"
        else
          return "thumbnail"

  { $item, item } = spec
  # if new image is being added we have some extra information
  { imageDataURL, imageSource, imageCaption } = spec if item.type is 'factory'
  if item.type is 'factory'
    document.documentElement.style.cursor = 'default'
    $item.removeClass('factory').addClass(item.type = 'image')
    $item.unbind()
    newImage = true
  else
    newImage = false

  keydownHandler = (e) ->

    if e.which is 27 # esc for save
      e.preventDefault()
      $item.focusout()
      return false

    if (e.ctrlKey or e.metaKey) and e.which is 83 # ctrl-s for save
      e.preventDefault()
      $item.focusout()
      return false
    
    if (e.ctrlKey or e.metaKey) and e.which is 73 # ctrl-i for information
      e.preventDefault()
      page = $(e.target).parents('.page') unless e.shiftKey
      link.doInternalLink "about image plugin", page
      return false

    # lets not support ctrl-m, at least for now

  focusoutHandler = (event) ->
    # need to test if focus is still within the imageEditor div
    # $item.removeClass 'imageEditing'
    editorDiv = document.querySelector('.imageEditing')
    if editorDiv.contains(event.relatedTarget)
      return
    
    $page = $item.parents('.page:first')
    if newImage
      item.url = await resizeImage imageDataURL
    $item.removeClass 'imageEditing'
    $item.unbind()
    if item.text = $item.find('textarea').val()
      item.size = $item.find('#size-select').val() ? 'thumbnail'
      plugin.do $item.empty(), item
      return if item.text is original.text and item.size is original.size
      if item.hasOwnProperty('caption')
        delete item.caption 
      pageHandler.put $page, { type: 'edit', id: item.id, item: item }

    else
      index = $(".item").index($item)
      $item.remove()
      plugin.renderFrom index



  return if $item.hasClass 'imageEditing'
  $item.addClass 'imageEditing'
  $item.unbind()
  original = {
    text: item.text ? ''
    size: item.size ? ''
  }

  # add something so we can detect if the item is unchanged

  if !newImage
    imageDataURL = item.url
    imageCaption = item.text ||= item.caption
  

  imgPossibleSize = await imageSize(imageDataURL)
  if item.size
    imgCurrentSize = item.size
  else
    if newImage
      imgCurrentSize = imgPossibleSize
    else
      imgCurrentSize = "thumbnail"
  $item.addClass(imgCurrentSize)

  $imageEditor = $ """
    <img class='#{imgCurrentSize}' src='#{imageDataURL}'>
    <textarea>#{escape imageCaption}</textarea>
    """
  
  $item.html $imageEditor

  $item.append """<div id="image-options"></div>"""

  if imgPossibleSize is "wide"
    $('#image-options').append """
    <label>Image Size:</label>
    <select id="size-select">
      <option value="" disabled>--Please choose a size--</option>
      <option value="thumbnail">Half page width</option>
      <option value="wide">Full page width</option>
    </select>
    """

    $item.find("#size-select option[value='#{imgCurrentSize}']").attr('selected', true)
    
    $('#size-select').change( () ->
      $item.removeClass("thumbnail wide")
      $item.addClass($(this).val())
      $item.find('img').removeClass("thumbnail wide")
        .addClass($(this).val())
      
      )

### MAYBE TODO: option to archive new images to web3.storage
  if newImage and imgSize is "wide"
    $('#image-options').append """
    <label>Archive Image:</label>
    <input id="web3APIKey" type="text" placeholder="Web3.Storage API token">
    """
 ###

  $item.focusout focusoutHandler
    .bind 'keydown', keydownHandler  

  $imageEditor.focus()
  
  # from https://web.archive.org/web/20140327091827/http://www.benknowscode.com/2014/01/resizing-images-in-browser-using-canvas.html
  # Patrick Oswald version from comment, coffeescript and further simplification for wiki

  resizeImage = (dataURL) ->
    src = new Image
    cW = undefined
    cH = undefined
    # target size
    tW = 500
    tH = 300
    # image quality
    imageQuality = 0.5

    smallEnough = (img) ->
      img.width <= tW or img.height <= tH

    new Promise (resolve) ->
      src.src = dataURL
      src.onload = ->
        resolve()
    .then () ->
      cW = src.naturalWidth
      cH = src.naturalHeight
    .then () ->
      # determine size for first squeeze
      return if smallEnough src

      oversize = Math.max 1, Math.min cW/tW, cH/tH
      iterations = Math.floor Math.log2 oversize
      prescale = oversize / 2**iterations

      cW = Math.round(cW / prescale)
      cH = Math.round(cH / prescale)

    .then () ->
      new Promise (resolve) ->
        tmp = new Image
        tmp.src = src.src
        tmp.onload = ->
          if smallEnough tmp
            return resolve dataURL  
          canvas = document.createElement('canvas')
          canvas.width = cW
          canvas.height = cH
          context = canvas.getContext('2d')
          context.drawImage tmp, 0, 0, cW, cH
          dataURL = canvas.toDataURL('image/jpeg', imageQuality)
          cW /= 2
          cH /= 2
          tmp.src = dataURL
    .then ->
      return dataURL








module.exports = {emit, bind, editor}
