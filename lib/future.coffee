# A Future plugin represents a page that hasn't been written
# or wasn't found where expected. It recognizes template pages
# and offers to clone them or make a blank page.

resolve = require './resolve'
neighborhood = require './neighborhood'

lineup = require './lineup'
refresh = require './refresh'

emit = ($item, item) ->
  $item.append """#{item.text}<br><br><button class="create">create</button> new blank page"""
  if transport = item.create?.source?.transport
    $item.append """<br><button class="transport" data-slug=#{item.slug}>create</button> transport from #{transport}"""
    $item.append "<p class=caption> unavailable</p>"
    $.get 'http://localhost:4020', ->
      $item.find('.caption').text 'ready'
  if (info = neighborhood.sites[location.host])? and info.sitemap?
    for item in info.sitemap
      if item.slug.match /-template$/
        $item.append """<br><button class="create" data-slug=#{item.slug}>create</button> from #{resolve.resolveLinks "[[#{item.title}]]"}"""

bind = ($item, item) ->
  $item.find('button.transport').click (e) ->
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