editor = require './editor'
resolve = require './resolve'

# see http://fed.wiki.org/about-reference-plugin.html

emit = ($item, item) ->
  slug = item.slug or 'welcome-visitors'
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