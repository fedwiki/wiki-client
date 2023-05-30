# A Future plugin represents a page that hasn't been written
# or wasn't found where expected. It recognizes template pages
# and offers to clone them or make a blank page.

resolve = require './resolve'
neighborhood = require './neighborhood'

lineup = require './lineup'
refresh = require './refresh'

emit = ($item, item) ->

  $item.append """#{item.text}"""

  if isSecureContext and !isOwner
    $item.append """
      <div>
        <p>If this is your wiki, you are not logged in.</p>
      </div>
    """

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
    $item.append """
      <div>
        <p>Some remote wiki could not be reached.
          Clicking on tilted flags in the neighborhood bar will retry connecting.
          If any are not tilted when they stop spinning, retrying link might find the page you're looking for.</p>
      </div>
      <div>
        <p>Try accessing directly on the remote wiki, will open a new tab.</p>
        #{offerPages.join('\n')}
      </div>
    """
      
  if isSecureContext
    altContext = document.URL.replace(/^https/, 'http').replace(/\/\w+\/[\w-]+$/, '')
    $item.append """
      <div>
        <p>If the page is accessible directly, open the <a href="#{altContext}" target="_blank">lineup</a> using http, 
        opens in a new tab. Then clicking the link there that led you here.</p>
      </div>
      <div>
        <p>
      </div>
    """

  $item.append """<button class="create">create</button> new blank page"""

  if transport = item.create?.source?.transport
    $item.append """<br><button class="transport" data-slug=#{item.slug}>create</button> transport from #{transport}"""
    $item.append "<p class=caption> unavailable</p>"
    $.get '//localhost:4020', ->
      $item.find('.caption').text 'ready'

  if (info = neighborhood.sites[location.host])? and info.sitemap?
    for item in info.sitemap
      if item.slug.match /-template$/
        $item.append """<br><button class="create" data-slug=#{item.slug}>create</button> from #{resolve.resolveLinks "[[#{item.title}]]"}"""

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
