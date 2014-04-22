asSlug = require('./page').asSlug

resolutionContext = []

resolveFrom = (addition, callback) ->
  resolutionContext.push addition
  try
    callback()
  finally
    resolutionContext.pop()

resolveLinks = (string) ->
  renderInternalLink = (match, name) ->
    # spaces become 'slugs', non-alpha-num get removed
    slug = asSlug name
    "<a class=\"internal\" href=\"/#{slug}.html\" data-page-name=\"#{slug}\" title=\"#{resolutionContext.join(' => ')}\">#{name}</a>"
  string
    .replace(/\[\[([^\]]+)\]\]/gi, renderInternalLink)
    .replace(/\[((http|https|ftp):.*?) (.*?)\]/gi, """<a class="external" target="_blank" href="$1" title="$1" rel="nofollow">$3 <img src="/images/external-link-ltr-icon.png"></a>""")

module.exports = {resolutionContext, resolveFrom, resolveLinks}