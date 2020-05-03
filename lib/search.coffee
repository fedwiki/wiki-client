# The search module invokes neighborhood's query function,
# formats the results as story items, and then opens a
# page to present them.

pageHandler = require './pageHandler'
random = require './random'
link = require './link'
active = require './active'
newPage = require('./page').newPage
resolve = require './resolve'
page = require './page'

# from: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
escapeRegExp = (string) ->
  string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

# From reference.coffee
emit = ($item, item) ->
  slug = item.slug
  slug ||= page.asSlug item.title if item.title?
  slug ||= 'welcome-visitors'
  site = item.site
  resolve.resolveFrom site, ->
    $item.append """
      <p>
        <img class='remote'
          src='#{wiki.site(site).flag()}'
          title='#{site}'
          data-site="#{site}"
          data-slug="#{slug}"
        >
        #{resolve.resolveLinks "[[#{item.title or slug}]]"}
        —
        #{resolve.resolveLinks(item.text)}
      </p>
    """
finishClick = (e, name) ->
  e.preventDefault()
  page = $(e.target).parents('.page') unless e.shiftKey
  link.doInternalLink name, page, $(e.target).data('site')
  return false

createSearch = ({neighborhood})->
  incrementalSearch = (searchQuery)->
    if searchQuery.length < 2
      $('.incremental-search').remove()
      return
    if $('.incremental-search').length == 0
      offset = $('.searchbox').position()
      $('<div/>')
        .css('left', "#{offset.left}px")
        .css('bottom', "#{offset.top + $('.searchbox').height()}px")
        .addClass('incremental-search')
        .delegate '.internal', 'click', (e) ->
          e.target = $(e.target).parent()[0] if e.target.nodeName == 'SPAN'
          name = $(e.target).data 'pageName'
          # ensure that name is a string (using string interpolation)
          name = "#{name}"
          pageHandler.context = $(e.target).attr('title').split(' => ')
          finishClick e, name

        .delegate 'img.remote', 'click', (e) ->
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
        .appendTo($('.searchbox'))

    searchResults = neighborhood.search(searchQuery)
    searchTerms = searchQuery.split(' ')
            .map (t) ->
              return t.toLowerCase()
            .filter(String)
    searchHighlightRegExp = new RegExp("\\b(" + searchQuery.split(' ')
            .map (t) ->
              return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            .filter(String)
            .join('|') + ")", 'i')
    highlightText = (text) ->
      text.split(searchHighlightRegExp)
        .map (p) ->
          if searchTerms.includes p.toLowerCase()
            return "{{#{p}}}"
          else return p
        .join('')
    $search = $('.incremental-search').empty()
    if !searchResults.finds || searchResults.finds.length == 0
      $('<div/>').text('No results found').addClass('no-results').appendTo($search)
    count = 0
    max_results = 100
    for result in searchResults.finds
      count += 1
      if count == max_results + 1
        $('<div/>').text("#{searchResults.finds.length - max_results} results omitted").addClass('omitted-results').appendTo($search)
      if count > max_results
        continue
      $item = $('<div/>').appendTo($search)
      item =
        id: random.itemId(),
        type: "reference"
        site: result.site,
        slug: result.page.slug,
        title: highlightText(result.page.title)
        text: highlightText(result.page.synopsis)
      emit($item, item)
      $item.html($item.html()
        .split new RegExp("(\{\{.*?\}\})", 'i')
        .map (p) ->
          if (p.indexOf '{{') == 0
            return "<span class='search-term'>#{p.substring(2, p.length - 2)}</span>"
          else return p
        .join ''
      )

  performSearch = (searchQuery)->
    searchResults = neighborhood.search(searchQuery)
    if searchResults.finds && searchResults.finds.length == 1
      $('.incremental-search').find('.internal').click()
      $('.incremental-search').remove()
      return
    $('.incremental-search').remove()
    tally = searchResults.tally
    resultPage = newPage()
    resultPage.setTitle "Search for '#{searchQuery}'"
    resultPage.addParagraph """
        String '#{searchQuery}' found on #{tally.finds||'none'} of #{tally.pages||'no'} pages from #{tally.sites||'no'} sites.
        Text matched on #{tally.title||'no'} titles, #{tally.text||'no'} paragraphs, and #{tally.slug||'no'} slugs.
        Elapsed time #{tally.msec} milliseconds.
    """
    for result in searchResults.finds
      resultPage.addItem
        "type": "reference"
        "site": result.site
        "slug": result.page.slug
        "title": result.page.title
        "text": result.page.synopsis || ''

    link.showResult resultPage


  {
    incrementalSearch
    performSearch
  }
module.exports = createSearch
