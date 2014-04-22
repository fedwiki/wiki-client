# A Future plugin represents a page that hasn't been written
# or wasn't found where expected. It recognizes template pages
# and offers to clone them or make a blank page.

resolve = require './resolve'
neighborhood = require './neighborhood'

emit = (div, item) ->
  div.append """#{item.text}<br><br><button class="create">create</button> new blank page"""
  if (info = neighborhood.sites[location.host])? and info.sitemap?
    for item in info.sitemap
      if item.slug.match /-template$/
        div.append """<br><button class="create" data-slug=#{item.slug}>create</button> from #{resolve.resolveLinks "[[#{item.title}]]"}"""

bind = (div, item) ->

module.exports = {emit, bind}