wiki = require './wiki'
util = require './util'
active = require './active'
emptyPage = require('./page').emptyPage

createSearch = ({neighborhood})->
  performSearch = (searchQuery)->
    searchResults = neighborhood.search(searchQuery)
    tally = searchResults.tally

    resultPage = emptyPage()
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

    $resultPage = wiki.createPage(resultPage.getSlug()).addClass('ghost')
    $resultPage.appendTo($('.main'))
    wiki.buildPage( resultPage, $resultPage )
    active.set($('.page').last())


  {
    performSearch
  }
module.exports = createSearch
