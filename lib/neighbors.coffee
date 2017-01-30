# This module manages the display of site flags representing
# fetched sitemaps stored in the neighborhood. It progresses
# through a series of states which, when attached to the flags,
# cause them to animate as an indication of work in progress.

link = require './link'

sites = null
totalPages = 0


flag = (site) ->
  # status class progression: .wait, .fetch, .fail or .done
  wiki.site(site).getURL 'favicon.png', (url) ->
    """
      <span class="neighbor" data-site="#{site}">
        <div class="wait">
          <img src="#{url}" title="#{site}">
        </div>
      </span>
    """

inject = (neighborhood) ->
  sites = neighborhood.sites

bind = ->
  $neighborhood = $('.neighborhood')
  $('body')
    .on 'new-neighbor', (e, site) ->
      $thisNeighborhood = $neighborhood
      flag site, (siteFlag) ->
        $thisNeighborhood.append siteFlag
    .on 'new-neighbor-done', (e, site) ->
      pageCount = sites[site].sitemap.length
      img = $(""".neighborhood .neighbor[data-site="#{site}"]""").find('img')
      img.attr('title', "#{site}\n #{pageCount} pages")
      totalPages += pageCount
      $('.searchbox .pages').text "#{totalPages} pages"
    .delegate '.neighbor img', 'click', (e) ->
      link.doInternalLink 'welcome-visitors', null, @.title.split("\n")[0]

module.exports = {inject, bind}
