# The legacy module is what is left of the single javascript
# file that once was Smallest Federated Wiki. Execution still
# starts here and many event dispatchers are set up before
# the user takes control.

pageHandler = require './pageHandler'
state = require './state'
active = require './active'
refresh = require './refresh'
lineup = require './lineup'
drop = require './drop'
dialog = require './dialog'
link = require './link'

asSlug = require('./page').asSlug

$ ->
  dialog.emit()

# FUNCTIONS used by plugins and elsewhere


  LEFTARROW = 37
  RIGHTARROW = 39

  $(document).keydown (event) ->
    direction = switch event.which
      when LEFTARROW then -1
      when RIGHTARROW then +1
    if direction && not (event.target.tagName is "TEXTAREA")
      pages = $('.page')
      newIndex = pages.index($('.active')) + direction
      if 0 <= newIndex < pages.length
        active.set(pages.eq(newIndex))

# HANDLERS for jQuery events

  #STATE -- reconfigure state based on url
  $(window).on 'popstate', state.show

  $(document)
    .ajaxError (event, request, settings) ->
      return if request.status == 0 or request.status == 404
      console.log 'ajax error', event, request, settings
      # $('.main').prepend """
      #   <li class='error'>
      #     Error on #{settings.url}: #{request.responseText}
      #   </li>
      # """

  getTemplate = (slug, done) ->
    return done(null) unless slug
    console.log 'getTemplate', slug
    pageHandler.get
      whenGotten: (pageObject,siteFound) -> done(pageObject)
      whenNotGotten: -> done(null)
      pageInformation: {slug: slug}

  finishClick = (e, name) ->
    e.preventDefault()
    page = $(e.target).parents('.page') unless e.shiftKey
    link.doInternalLink name, page, $(e.target).data('site')
    return false

  $('.main')
    .delegate '.show-page-source', 'click', (e) ->
      e.preventDefault()
      $page = $(this).parent().parent()
      json = $page.data('data')
      dialog.open "JSON for #{json.title}",  $('<pre/>').text(JSON.stringify(json, null, 2))

    .delegate '.page', 'click', (e) ->
      active.set this unless $(e.target).is("a")

    .delegate '.internal', 'click', (e) ->
      name = $(e.target).data 'pageName'
      # ensure that name is a string (using string interpolation)
      name = "#{name}"
      pageHandler.context = $(e.target).attr('title').split(' => ')
      finishClick e, name

    .delegate 'img.remote', 'click', (e) ->
      name = $(e.target).data('slug')
      pageHandler.context = [$(e.target).data('site')]
      finishClick e, name

    .delegate '.revision', 'dblclick', (e) ->
      e.preventDefault()
      $page = $(this).parents('.page')
      page = $page.data('data')
      rev = page.journal.length-1
      action = page.journal[rev]
      json = JSON.stringify(action, null, 2)
      dialog.open "Revision #{rev}, #{action.type} action", $('<pre/>').text(json)

    .delegate '.action', 'click', (e) ->
      e.preventDefault()
      $action = $(e.target)
      if $action.is('.fork') and (name = $action.data('slug'))?
        pageHandler.context = [$action.data('site')]
        finishClick e, (name.split '_')[0]
      else
        $page = $(this).parents('.page')
        slug = asSlug($page.data('data').title)
        rev = $(this).parent().children().not('.separator').index($action)
        return if rev < 0
        $page.nextAll().remove() unless e.shiftKey
        lineup.removeAllAfterKey($page.data('key')) unless e.shiftKey
        link.createPage("#{slug}_rev#{rev}", $page.data('site'))
          .appendTo($('.main'))
          .each refresh.cycle
        active.set($('.page').last())

    .delegate '.fork-page', 'click', (e) ->
      $page = $(e.target).parents('.page')
      if $page.hasClass('local')
        unless pageHandler.useLocalStorage()
          item = $page.data('data')
          $page.removeClass('local')
          pageHandler.put $page, {type: 'fork', item} # push
      else
        if (remoteSite = $page.data('site'))?
          pageHandler.put $page, {type:'fork', site: remoteSite} # pull

    .delegate '.action', 'hover', ->
      id = $(this).attr('data-id')
      $("[data-id=#{id}]").toggleClass('target')
      $('.main').trigger('rev')

    .delegate '.item', 'hover', ->
      id = $(this).attr('data-id')
      $(".action[data-id=#{id}]").toggleClass('target')

    .delegate 'button.create', 'click', (e) ->
      getTemplate $(e.target).data('slug'), (template) ->
        $page = $(e.target).parents('.page:first')
        $page.removeClass 'ghost'
        pageObject = lineup.atKey $page.data('key')
        pageObject.become(template)
        page = pageObject.getRawPage()
        pageHandler.put $page, {type: 'create', id: page.id, item: {title:page.title, story:page.story}}
        refresh.rebuildPage pageObject, $page.empty()

    .delegate '.ghost', 'rev', (e) ->
      console.log 'rev', e
      $page = $(e.target).parents('.page:first')
      $item = $page.find('.target')
      position = $item.offset().top + $page.scrollTop() - $page.height()/2
      console.log 'scroll', $page, $item, position
      $page.stop().animate {scrollTop: postion}, 'slow'

    .delegate '.score', 'hover', (e) ->
      $('.main').trigger 'thumb', $(e.target).data('thumb')

    .bind 'dragenter', (evt) -> evt.preventDefault()
    .bind 'dragover', (evt) -> evt.preventDefault()
    .bind "drop", drop.dispatch
        page: (item) -> link.doInternalLink item.slug, null, item.site

  $(".provider input").click ->
    $("footer input:first").val $(this).attr('data-provider')
    $("footer form").submit()

  $('body').on 'new-neighbor-done', (e, neighbor) ->
    $('.page').each (index, element) ->
      refresh.emitTwins $(element)

  $ ->
    state.first()
    $('.page').each refresh.cycle
    active.set($('.page').last())

