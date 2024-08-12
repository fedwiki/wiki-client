# The license module explains federated wiki license terms
# including the proper attribution of collaborators.

resolve = require './resolve'
lineup = require './lineup'

cc = ->
  """
    <p>
      <a rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/">
      <img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by-sa/4.0/88x31.png" /></a>
    </p><p>
      This work is licensed under a
      <a rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/">
        Creative Commons Attribution-ShareAlike 4.0 International License
      </a>.
    </p><p>
      This license applies uniformly to all contributions
      by all authors. Where authors quote other sources
      they do so within the terms of fair use or other
      compatiable terms.
    </p>
  """

authors = (page, site) ->
  return "" unless page.journal?
  done = {}
  list = []
  for action in page.journal.slice(0).reverse()
    site = action.site if action.site?
    site = action.attribution.site if action.attribution?.site?
    unless action.type is 'fork' or done[site]?
      siteURL = wiki.site(site).getDirectURL("")
      siteFlag = wiki.site(site).flag()
      list.push """<a href="#{siteURL}" target="_blank"><img class="remote" title="#{site}" src="#{siteFlag}"> #{site}</a>"""
      done[site] = true
  return "" unless list.length > 0
  """
    <p>
      Author's Sites:
    </p><p>
      #{list.join "<br>"}
    </p>
  """

provenance = (action) ->
  return "" unless action?.provenance?
  """
    <p>
      Created From:
    </p><p>
      #{resolve.resolveLinks action.provenance}
    </p>
  """

info = ($page) ->
  pageObject = lineup.atKey($page.data('key'))
  page = pageObject.getRawPage()
  site = pageObject.getRemoteSite location.hostname
  cc() +
  authors(page, site) +
  provenance(page.journal[0])


module.exports = {info}
