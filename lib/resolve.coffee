# The function resolveLinks converts link markup to html syntax.
# The html will have a search path (the resolutionContext) encoded
# into the title of <a> tags it generates.

asSlug = require('./page').asSlug

module.exports = resolve = {}

resolve.resolutionContext = []

resolve.escape = escape = (string) ->
  (string||'')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

resolve.resolveFrom = (addition, callback) ->
  resolve.resolutionContext.push addition
  try
    callback()
  finally
    resolve.resolutionContext.pop()

# resolveLinks takes a second argument which is a substitute text sanitizer.
# Plugins that do their own markup should insert themselves here but they
# must escape html as part of their processing. Sanitizers must pass markers〖12〗.

resolve.resolveLinks = (string, sanitize=escape) ->
  stashed = []

  stash = (text) ->
    here = stashed.length
    stashed.push text
    "〖#{here}〗"

  unstash = (match, digits) ->
    stashed[+digits]

  internal = (match, name) ->
    slug = asSlug name
    if slug.length
      stash """<a class="internal" href="/#{slug}.html" data-page-name="#{slug}" title="#{resolve.resolutionContext.join(' => ')}">#{escape name}</a>"""
    else
      match

  external = (match, href, protocol, rest) ->
    stash """<a class="external" target="_blank" href="#{href}" title="#{href}" rel="nofollow">#{escape rest} <img src="/images/external-link-ltr-icon.png"></a>"""

  # markup conversion happens in four phases:
  #   - unexpected markers are adulterated
  #   - links are found, converted, and stashed away properly escaped
  #   - remaining text is sanitized and/or escaped
  #   - unique markers are replaced with unstashed links

  string = (string||'')
    .replace /〖(\d+)〗/g, "〖 $1 〗"
    .replace /\[\[([^\]]+)\]\]/gi, internal
    .replace /\[((http|https|ftp):.*?) (.*?)\]/gi, external
  sanitize string
    .replace /〖(\d+)〗/g, unstash


