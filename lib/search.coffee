# The search module invokes neighborhood's query function,
# formats the results as story items, and then opens a
# page to present them.

link = require './link'
active = require './active'
newPage = require('./page').newPage

createSearch = ({neighborhood})->
  performSearch = (searchQuery)->
    searchResults = neighborhood.search(searchQuery)
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
    performSearch
  }
module.exports = createSearch
