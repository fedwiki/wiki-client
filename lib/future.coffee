# A Future plugin represents a page that hasn't been written
# or wasn't found where expected. It recognizes template pages
# and offers to clone them or make a blank page.

resolve = require './resolve'
neighborhood = require './neighborhood'

lineup = require './lineup'
refresh = require './refresh'

emit = ($item, item) ->

  $item.append """#{item.text}"""

  $item.append """<br><br><button class="create">create</button> new blank page"""

  if transport = item.create?.source?.transport
    $item.append """<br><button class="transport" data-slug=#{item.slug}>create</button> transport from #{transport}"""
    $item.append "<p class=caption> unavailable</p>"
    $.get '//localhost:4020', ->
      $item.find('.caption').text 'ready'

  if (info = neighborhood.sites[location.host])? and info.sitemap?
    for localPage in info.sitemap
      if localPage.slug.match /-template$/
        $item.append """<br><button class="create" data-slug=#{localPage.slug}>create</button> from #{resolve.resolveLinks "[[#{localPage.title}]]"}"""

  if (item.context? and item.context.length > 0) or (isSecureContext and !location.hostname.endsWith('localhost'))
    $item.append """
      <p>Some possible places to look for this page, if it exists.</p>
    """

  offerAltLineup = true

  if item.context? and item.context.length > 0
    offerPages = []
    item.context.forEach (c) ->
      if wiki.neighborhood[c].lastModified is 0
        slug = wiki.asSlug(item.title)
        offerPages.push """
          <p>
            <img class='remote'
              src='#{wiki.site(c).flag()}' 
              title="#{c}">
            <a class='internal' 
              href='http://#{c}/#{slug}.html' 
              target='_blank'>#{c}</a>
          </p>
        """
    if offerPages.length > 0
      $item.append """
        <div>
          <p>Try on remote wiki where it was expected to be found, opens in a new tab.</p>
          #{offerPages.join('\n')}
        </div>
      """
    else
      offerAltLineup = false
      $item.append """
        <div>
          <p>None of the expected places were unreachable.</p>
        </div>
      """
  else
    offerAltLineup = false
      
  if isSecureContext and offerAltLineup and !location.hostname.endsWith('localhost')
    altContext = document.URL.replace(/^https/, 'http').replace(/\/\w+\/[\w-]+$/, '')
    altLinkText = if altContext.length > 55 then altContext.substring(0,55)+'...' else altContext
    $item.append """
      <div>
        <p>Try opening lineup using http, opens in a new tab.</p>
        <p><a href="#{altContext}" target="_blank"><img class='remote' src='/favicon.png' title='#{location.host}'> #{altLinkText}</a>.</p>
      </div>
      <div>
        <p>
      </div>
    """

bind = ($item, item) ->
  $item.find('button.transport').on 'click', (e) ->
    $item.find('.caption').text 'waiting'

    # duplicatingTransport and Templage logic

    params =
      title: $item.parents('.page').data('data').title
      create: item.create

    req =
      type: "POST",
      url: item.create.source.transport
      dataType: 'json',
      contentType: "application/json",
      data: JSON.stringify(params)

    $.ajax(req).done (page) ->
      $item.find('.caption').text 'ready'
      resultPage = wiki.newPage(page)
      $page = $item.parents('.page')
      pageObject = lineup.atKey $page.data('key')
      pageObject.become(resultPage,resultPage)
      page = pageObject.getRawPage()
      refresh.rebuildPage pageObject, $page.empty()


module.exports = {emit, bind}
