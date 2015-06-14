# An Importer plugin completes the ghost page created upon drop of a site export file.

util = require './util'
link = require './link'
newPage = require('./page').newPage

expand = (text)->
  text
    .replace /&/g, '&amp;'
    .replace /</g, '&lt;'
    .replace />/g, '&gt;'


emit = ($item, item) ->

  render = (pages) ->
    result = []
    for slug, page of pages
      line = "<a href=#{slug}>#{ page.title || slug }</a>"
      if page.journal && (date = page.journal[page.journal.length - 1].date)
        line += " &nbsp; from #{util.formatElapsedTime date}"
      result.push line
    result.join '<br>'

  $item.append """
    <p style="background-color:#eee;padding:15px;">
      #{render item.pages}
    </p>
  """

bind = ($item, item) ->
  $item.find('a').click (e) ->
    slug = $(e.target).attr('href')
    page = $(e.target).parents('.page') unless e.shiftKey
    link.showResult newPage(item.pages[slug]), page

    false

  # $item.dblclick -> wiki.textEditor $item, item

module.exports = {emit, bind}
