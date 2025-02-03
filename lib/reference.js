// The Reference plugin holds a site and page name to be
// found on that site. Search, for example, produces a page of
// references. Double click will edit the body of a reference
// but not the name and site.

const editor = require('./editor')
const resolve = require('./resolve')
const page = require('./page')

// see http://fed.wiki.org/about-reference-plugin.html

const emit = function ($item, item) {
  let slug = item.slug
  if (!slug && item.title) {
    slug = page.asSlug(item.title)
  }
  if (!slug) {
    slug = 'welcome-visitors'
  }
  const site = item.site
  resolve.resolveFrom(site, () =>
    $item.append(`
<p>
<img class='remote'
  src='${wiki.site(site).flag()}'
  title='${site}'
  data-site="${site}"
  data-slug="${slug}"
>
${resolve.resolveLinks(`[[${item.title || slug}]]`)}
—
${resolve.resolveLinks(item.text)}
</p>`),
  )
}
const bind = ($item, item) => $item.on('dblclick', () => editor.textEditor($item, item))

module.exports = { emit, bind }
