link = require './link'

sites = null
totalPages = 0


flag = (site) ->
  # status class progression: .wait, .fetch, .fail or .done
  """
    <span class="neighbor" data-site="#{site}">
      <div class="wait">
        <img src="http://#{site}/favicon.png" title="#{site}">
      </div>
    </span>
  """

inject = (neighborhood) ->
  sites = neighborhood.sites

bind = ->
  $neighborhood = $('.neighborhood')
  $('body')
    .on 'new-neighbor', (e, site) ->
      $neighborhood.append flag site
    .on 'new-neighbor-done', (e, site) ->
      pageCount = sites[site].sitemap.length
      img = $(""".neighborhood .neighbor[data-site="#{site}"]""").find('img')
      img.attr('title', "#{site}\n #{pageCount} pages")
      totalPages += pageCount
      $('.searchbox .pages').text "#{totalPages} pages"
    .delegate '.neighbor img', 'click', (e) ->
      link.doInternalLink 'welcome-visitors', null, @.title.split("\n")[0]

module.exports = {inject, bind}

