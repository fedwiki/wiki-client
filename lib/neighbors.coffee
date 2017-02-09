# This module manages the display of site flags representing
# fetched sitemaps stored in the neighborhood. It progresses
# through a series of states which, when attached to the flags,
# cause them to animate as an indication of work in progress.

link = require './link'
siteAdapter = require './siteAdapter'

sites = null
totalPages = 0

###
flag = (site, cb) ->
  # status class progression: .wait, .fetch, .fail or .done
  siteAdapter.site(site).getURL 'favicon.png', (url) ->
    cb """
      <span class="neighbor" data-site="#{site}">
        <div class="wait">
          <img src="http://#{site}/favicon.png" title="#{site}">
        </div>
      </span>
    """
###

inject = (neighborhood) ->
  sites = neighborhood.sites

bind = ->
  console.log 'neighbours about to bind'
  $neighborhood = $('.neighborhood')
  $('body')
    .on 'new-neighbor', (e, site) ->
      console.log 'in new-neighbor, about to call getURL', site
      siteAdapter.site(site).getURL 'favicon.png', (url) ->
        console.log 'in new-neighbor', url
        $neighborhood.append """
          <span class="neighbor" data-site="#{site}">
            <div class="wait">
              <img src="#{url}" title="#{site}">
            </div>
          </span>
        """
    .on 'new-neighbor-done', (e, site) ->
      pageCount = sites[site].sitemap.length
      img = $(""".neighborhood .neighbor[data-site="#{site}"]""").find('img')
      img.attr('title', "#{site}\n #{pageCount} pages")
      totalPages += pageCount
      $('.searchbox .pages').text "#{totalPages} pages"
    .delegate '.neighbor img', 'click', (e) ->
      link.doInternalLink 'welcome-visitors', null, @.title.split("\n")[0]

module.exports = {inject, bind}
