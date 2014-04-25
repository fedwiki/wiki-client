# The function resolveLinks converts link markup to html syntax.
# The html will have a search path (the resolutionContext) encoded
# into the title of <a> tags it generates.

asSlug = require('./page').asSlug

module.exports = resolve = {}

resolve.resolutionContext = []

resolve.resolveFrom = (addition, callback) ->
  resolve.resolutionContext.push addition
  try
    callback()
  finally
    resolve.resolutionContext.pop()

resolve.resolveLinks = (string) ->
  renderInternalLink = (match, name) ->
    # spaces become 'slugs', non-alpha-num get removed
    slug = asSlug name
    "<a class=\"internal\" href=\"/#{slug}.html\" data-page-name=\"#{slug}\" title=\"#{resolve.resolutionContext.join(' => ')}\">#{name}</a>"
  string
    .replace(/\[\[([^\]]+)\]\]/gi, renderInternalLink)
    .replace(/\[((http|https|ftp):.*?) (.*?)\]/gi, """<a class="external" target="_blank" href="$1" title="$1" rel="nofollow">$3 <img src="/images/external-link-ltr-icon.png"></a>""")


