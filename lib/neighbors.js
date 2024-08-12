# This module manages the display of site flags representing
# fetched sitemaps stored in the neighborhood. It progresses
# through a series of states which, when attached to the flags,
# cause them to animate as an indication of work in progress.

link = require './link'
wiki = require './wiki'
neighborhood = require './neighborhood'
util = require './util'

sites = null
totalPages = 0

hasLinks = (element) -> element.hasOwnProperty('links')


flag = (site) ->
  # status class progression: .wait, .fetch, .fail or .done
  """
    <span class="neighbor" data-site="#{site}">
      <div class="wait">
        <img src="#{wiki.site(site).flag()}" title="#{site}">
      </div>
    </span>
  """

inject = (neighborhood) ->
  sites = neighborhood.sites

formatNeighborTitle = (site) ->
  title = ''
  title += "#{site}\n"
  try
    pageCount = sites[site].sitemap.length
  catch error
    pageCount = 0
  try
    if sites[site].sitemap.some(hasLinks)
      title += "#{pageCount} pages with 2-way links\n"
    else
      title += "#{pageCount} pages\n"
  catch error
    console.info '+++ sitemap not valid for ', site
  if sites[site].lastModified != 0
    title += "Updated #{util.formatElapsedTime(sites[site].lastModified)}"
    title += ", next refresh #{util.formatDelay(sites[site].nextCheck)}" if sites[site].nextCheck - Date.now() > 0
  return title
  

bind = ->
  $neighborhood = $('.neighborhood')
  $('body')
    .on 'new-neighbor', (e, site) ->
      $neighborhood.append flag site
    .on 'new-neighbor-done', (e, site) ->
      try
        pageCount = sites[site].sitemap.length
      catch error
        pageCount = 0      
      totalPages = Object.values(neighborhood.sites).reduce ((sum, site) -> 
        try
          if site.sitemapRequestInflight
            return sum
          else
            return sum + site.sitemap.length
        catch error
          return sum
        ), 0
      $('.searchbox .pages').text "#{totalPages} pages"
    .on 'mouseenter', '.neighbor', (e) ->
      $neighbor = $(e.currentTarget)
      site = $neighbor.data().site
      $neighbor.find('img:first').attr('title', formatNeighborTitle(site))
    .on 'click', '.neighbor img', (e) ->
      # add handling refreshing neighbor that has failed
      if $(e.target).parent().hasClass('fail')
        $(e.target).parent().removeClass('fail').addClass('wait')
        site = $(e.target).attr('title').split('\n')[0]
        wiki.site(site).refresh () ->
          console.log 'about to retry neighbor'
          neighborhood.retryNeighbor(site)
      else
        link.doInternalLink 'welcome-visitors', null, @.title.split("\n")[0]

module.exports = {inject, bind}
