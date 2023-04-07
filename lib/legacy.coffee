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
target = require './target'
license = require './license'
plugin = require './plugin'
util = require './util'

asSlug = require('./page').asSlug
newPage = require('./page').newPage

preLoadEditors = (catalog) ->
  catalog
    .filter((entry) -> entry.editor)
    .forEach((entry) ->
      console.log("#{entry.name} Plugin declares an editor, so pre-loading the plugin")
      wiki.getPlugin(entry.name.toLowerCase(), (plugin) ->
          if ! plugin.editor or typeof plugin.editor != 'function'
            console.log("""#{entry.name} Plugin ERROR.
              Cannot find `editor` function in plugin. Set `"editor": false` in factory.json or
              Correct the plugin to include all three of `{emit, bind, editor}`
              """)
        )
    )

wiki.origin.get 'system/factories.json', (error, data) ->
  window.catalog = data
  preLoadEditors data

$ ->
  dialog.emit()

# FUNCTIONS used by plugins and elsewhere


  LEFTARROW = 37
  RIGHTARROW = 39

  $(document).on "keydown", (event) ->
    direction = switch event.which
      when LEFTARROW then -1
      when RIGHTARROW then +1
    if direction && not $(event.target).is(":input")
      pages = $('.page')
      newIndex = pages.index($('.active')) + direction
      if 0 <= newIndex < pages.length
        active.set(pages.eq(newIndex))
    if (event.ctrlKey || event.metaKey) and event.which == 83 #ctrl-s for search
      event.preventDefault()
      $('input.search').trigger 'focus'

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

  commas = (number) ->
    "#{number}".replace /(\d)(?=(\d\d\d)+(?!\d))/g, "$1,"

  readFile = (file) ->
    if file?.type == 'application/json'
      reader = new FileReader()
      reader.onload = (e) ->
        result = e.target.result
        pages = JSON.parse result
        resultPage = newPage()
        resultPage.setTitle "Import from #{file.name}"
        if pages.title? && pages.story? && pages.journal?
          slug = asSlug pages.title
          page = pages
          pages = {}
          pages[slug] = page
          resultPage.addParagraph """
            Import of one page
            (#{commas file.size} bytes)
            from a page-json file dated #{file.lastModifiedDate}.
          """
        else
          resultPage.addParagraph """
            Import of #{Object.keys(pages).length} pages
            (#{commas file.size} bytes)
            from an export file dated #{file.lastModifiedDate}.
          """
        resultPage.addItem {type: 'importer', pages: pages}
        link.showResult resultPage
      reader.readAsText(file)

  deletePage = (pageObject, $page) ->
    # console.log 'fork to delete'
    pageHandler.delete pageObject, $page, (err) ->
      return if err?
      # console.log 'server delete successful'
      if pageObject.isRecycler()
        # make recycler page into a ghost
        $page.addClass('ghost')
      else
        futurePage = refresh.newFuturePage(pageObject.getTitle(), pageObject.getCreate())
        pageObject.become futurePage
        $page.attr 'id', futurePage.getSlug()
        refresh.rebuildPage pageObject, $page
        $page.addClass('ghost')

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

  originalPageIndex = null
  $('.main')
    .sortable({handle: '.page-handle', cursor: 'grabbing'})
      .on 'sortstart', (evt, ui) ->
        return if not ui.item.hasClass('page')
        noScroll = true
        active.set ui.item, noScroll
        originalPageIndex = $(".page").index(ui.item[0])
      .on 'sort', (evt, ui) ->
        return if not ui.item.hasClass('page')
        $page = ui.item
        # Only mark for removal if there's more than one page (+placeholder) left
        if evt.pageY < 0 and $(".page").length > 2
          $page.addClass('pending-remove')
        else
          $page.removeClass('pending-remove')

      .on 'sortstop', (evt, ui) ->
        return if not ui.item.hasClass('page')
        $page = ui.item
        $pages = $('.page')
        index = $pages.index($('.active'))
        firstItemIndex = $('.item').index($page.find('.item')[0])
        if $page.hasClass('pending-remove')
          return if $pages.length == 1
          lineup.removeKey($page.data('key'))
          $page.remove()
          active.set($('.page')[index])
        else
          lineup.changePageIndex($page.data('key'), index)
          active.set $('.active')
          if originalPageIndex < index
            index = originalPageIndex
            firstItemIndex = $('.item').index($($('.page')[index]).find('.item')[0])
        plugin.renderFrom firstItemIndex
        state.setUrl()
        state.debugStates() if window.debug

    .on 'click', '.show-page-license', (e) ->
      e.preventDefault()
      $page = $(this).parents('.page')
      title = $page.find('h1').text().trim()
      dialog.open "License for #{title}", license.info($page)

    .on 'click', '.show-page-source', (e) ->
      e.preventDefault()
      $page = $(this).parents('.page')
      page = lineup.atKey($page.data('key')).getRawPage()
      dialog.open "JSON for #{page.title}",  $('<pre/>').text(JSON.stringify(page, null, 2))

    .on 'click', '.page', (e) ->
      active.set this unless $(e.target).is("a")

    .on 'click', '.internal', (e) ->
      $link = $(e.target)
      title = $link.text() or $link.data 'pageName'
      # ensure that name is a string (using string interpolation)
      title = "#{title}"
      pageHandler.context = $(e.target).attr('title').split(' => ')
      finishClick e, title

    .on 'click', 'img.remote', (e) ->
      # expand to handle click on temporary flag
      if $(e.target).attr('src').startsWith('data:image/png')
        e.preventDefault()
        site = $(e.target).data('site')
        wiki.site(site).refresh () ->
          # empty function...
      else
        name = $(e.target).data('slug')
        pageHandler.context = [$(e.target).data('site')]
        finishClick e, name

    .on 'dblclick', '.revision', (e) ->
      e.preventDefault()
      $page = $(this).parents('.page')
      page = lineup.atKey($page.data('key')).getRawPage()
      rev = page.journal.length-1
      action = page.journal[rev]
      json = JSON.stringify(action, null, 2)
      dialog.open "Revision #{rev}, #{action.type} action", $('<pre/>').text(json)

    .on 'click', '.action', (e) ->
      e.preventDefault()
      $action = $(e.target)
      if $action.is('.fork') and (name = $action.data('slug'))?
        pageHandler.context = [$action.data('site')]
        finishClick e, (name.split '_')[0]
      else
        $page = $(this).parents('.page')
        key = $page.data('key')
        slug = lineup.atKey(key).getSlug()
        rev = $(this).parent().children().not('.separator').index($action)
        return if rev < 0
        $page.nextAll().remove() unless e.shiftKey
        lineup.removeAllAfterKey(key) unless e.shiftKey
        link.createPage("#{slug}_rev#{rev}", $page.data('site'))
          .appendTo($('.main'))
          .each (_i, e) ->
            refresh.cycle $(e)
        active.set($('.page').last())

    .on 'mouseenter', '.action', (e) ->
      $action = $(e.target)
      action = $action.data().action
      $action.attr('title',util.formatActionTitle(action))

    .on 'click', '.fork-page', (e) ->
      $page = $(e.target).parents('.page')
      return if $page.find('.future').length
      pageObject = lineup.atKey $page.data('key')
      if $page.attr('id').match /_rev0$/
        deletePage pageObject, $page
      else
        action = {type: 'fork'}
        if $page.hasClass('local')
          return if pageHandler.useLocalStorage()
          $page.removeClass('local')
        else if pageObject.isRecycler()
          $page.removeClass('recycler')
        else if pageObject.isRemote()
          action.site = pageObject.getRemoteSite()
        if $page.data('rev')?
          $page.find('.revision').remove()
        $page.removeClass 'ghost'
        $page.attr('id', $page.attr('id').replace(/_rev\d+$/,''))
        state.setUrl()
        for p,i in $('.page')
          if $(p).data('key') != $page.data('key') and 
             $(p).attr('id') == $page.attr('id') and 
             $(p).data('site') in [undefined, null, 'view', 'origin', 'local', 'recycler', location.host]
            $(p).addClass('ghost')
        pageHandler.put $page, action

    .on 'click', 'button.create', (e) ->
      getTemplate $(e.target).data('slug'), (template) ->
        $page = $(e.target).parents('.page:first')
        $page.removeClass 'ghost'
        pageObject = lineup.atKey $page.data('key')
        pageObject.become(template)
        page = pageObject.getRawPage()
        refresh.rebuildPage pageObject, $page.empty()
        pageHandler.put $page, {type: 'create', id: page.id, item: {title:page.title, story:page.story}}

    .on 'mouseenter mouseleave', '.score', (e) ->
      console.log "in .score..."
      $('.main').trigger 'thumb', $(e.target).data('thumb')

    .on 'click', 'a.search', (e) ->
      $page = $(e.target).parents('.page')
      key = $page.data('key')
      pageObject = lineup.atKey key
      resultPage = newPage()
      resultPage.setTitle "Search from '#{pageObject.getTitle()}'"
      resultPage.addParagraph """
          Search for pages related to '#{pageObject.getTitle()}'.
          Each search on this page will find pages related in a different way.
          Choose the search of interest. Be patient.
      """
      resultPage.addParagraph "Find pages with links to this title."
      resultPage.addItem
        type: 'search'
        text: "SEARCH LINKS #{pageObject.getSlug()}"
      resultPage.addParagraph "Find pages with titles similar to this title."
      resultPage.addItem
        type: 'search'
        text: "SEARCH SLUGS #{pageObject.getSlug()}"
      resultPage.addParagraph "Find pages neighboring  this site."
      resultPage.addItem
        type: 'search'
        text: "SEARCH SITES #{pageObject.getRemoteSite(location.host)}"
      resultPage.addParagraph "Find pages sharing any of these items."
      resultPage.addItem
        type: 'search'
        text: "SEARCH ANY ITEMS #{(item.id for item in pageObject.getRawPage().story).join ' '}"
      $page.nextAll().remove() unless e.shiftKey
      lineup.removeAllAfterKey(key) unless e.shiftKey
      link.showResult resultPage

    .on 'dragenter', (evt) -> evt.preventDefault()
    .on 'dragover', (evt) -> evt.preventDefault()
    .on "drop", drop.dispatch
      page: (item) -> link.doInternalLink item.slug, null, item.site
      file: (file) -> readFile file

  $(".provider input").on 'click', () ->
    $("footer input:first").val $(this).attr('data-provider')
    $("footer form").submit()

  $('body').on 'new-neighbor-done', (e, neighbor) ->
    $('.page').each (index, element) ->
      refresh.emitTwins $(element)
      # refresh backlinks??

  getPluginReference = (title) ->
    return new Promise((resolve, reject) ->
      slug = asSlug(title)
      wiki.origin.get "#{slug}.json", (error, data) ->
        resolve {
          title,
          slug,
          type: "reference",
          text: (if error then error.msg else data?.story[0].text) or ""
        }
      )

  $("<span>&nbsp; ☰ </span>")
    .css({"cursor":"pointer"})
    .appendTo('footer')
    .on 'click', () ->
      resultPage = newPage()
      resultPage.setTitle "Selected Plugin Pages"
      resultPage.addParagraph """
        Installed plugins offer these utility pages:
      """
      return unless window.catalog

      titles = []
      for info in window.catalog
        if info.pages
          for title in info.pages
            titles.push title

      Promise.all(titles.map(getPluginReference)).then (items) ->
        items.forEach (item) ->
          resultPage.addItem item
        link.showResult resultPage

  # $('.editEnable').is(':visible')
  $("<span>&nbsp; wiki <span class=editEnable>✔︎</span> &nbsp; </span>")
    .css({"cursor":"pointer"})
    .appendTo('footer')
    .on 'click', () ->
      $('.editEnable').toggle()
      $('.page').each ->
        $page = $(this)
        pageObject = lineup.atKey $page.data('key')
        refresh.rebuildPage pageObject, $page.empty()
  $('.editEnable').toggle() unless isAuthenticated

  target.bind()

  $ ->
    state.first()
    pages = $('.page').toArray()
    # Render pages in order
    # Emits and "bind creations" for the previous page must be complete before we start
    # rendering the next page or plugin bind ordering will not work
    renderNextPage = (pages) ->
      if pages.length == 0
        active.set($('.page').last())
        return
      $page = $(pages.shift())
      refresh.cycle($page).then () ->
        renderNextPage(pages)
    renderNextPage(pages)
