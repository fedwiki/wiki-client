# An Importer plugin completes the ghost page created upon drop of a site export file.

util = require './util'
link = require './link'
newPage = require('./page').newPage

escape = (text)->
  text
    .replace /&/g, '&amp;'
    .replace /</g, '&lt;'
    .replace />/g, '&gt;'

emit = ($item, item) ->

  render = (pages) ->
    result = []
    for slug, page of pages
      line = "<a href=#{slug}>#{ escape(page.title) || slug }</a>"
      if page.journal
        if (date = page.journal[page.journal.length - 1].date)
          line += " &nbsp; from #{util.formatElapsedTime date}"
        else
          line += " &nbsp; from revision #{page.journal.length - 1}"
      result.push line
    result.join '<br>'

  $item.append """
    <p style="background-color:#eee;padding:15px;">
      #{render item.pages}
    </p>
  """

bind = ($item, item) ->
  $item.find('a').on 'click', (e) ->
    slug = $(e.target).attr('href')
    $page = $(e.target).parents('.page') unless e.shiftKey
    pageObject = newPage(item.pages[slug])
    link.showResult pageObject, {$page}
    false

module.exports = {emit, bind}
