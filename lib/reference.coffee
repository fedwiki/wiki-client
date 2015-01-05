# The Reference plugin holds a site and page name to be
# found on that site. Search, for example, produces a page of
# references. Double click will edit the body of a reference
# but not the name and site.

editor = require './editor'
resolve = require './resolve'
page = require './page'

# see http://fed.wiki.org/about-reference-plugin.html

emit = ($item, item) ->
  slug = item.slug
  slug ||= page.asSlug item.title if item.title?
  slug ||= 'welcome-visitors'
  site = item.site
  resolve.resolveFrom site, ->
    $item.append """
      <p style='margin-bottom:3px;'>
        <img class='remote'
          src='//#{site}/favicon.png'
          title='#{site}'
          data-site="#{site}"
          data-slug="#{slug}"
        >
        #{resolve.resolveLinks "[[#{item.title or slug}]]"}
      </p>
      <div>
        #{resolve.resolveLinks(item.text)}
      </div>
    """
bind = ($item, item) ->
  $item.dblclick -> editor.textEditor $item, item

module.exports = {emit, bind}