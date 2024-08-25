// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
// Here is where we attach federated semantics to internal
// links. Call doInternalLink to add a new page to the display
// given a page name, a place to put it an an optional site
// to retrieve it from.

const lineup = require('./lineup');
const active = require('./active');
const refresh = require('./refresh');
const {asTitle, asSlug, pageEmitter} = require('./page');
const wiki = require('./wiki');

const createPage = function(name, loc, title=null) {
  let site;
  if (loc && (loc !== 'view')) { site = loc; }
  if (!title) { title = asTitle(name); }
  const $page = $(`\
<div class="page" id="${name}" tabindex="-1">
  <div class="paper">
    <div class="twins"> <p> </p> </div>
    <div class="header">
      <h1> <img class="favicon" src="${wiki.site(site).flag()}" height="32px"> ${title} </h1>
    </div>
  </div>
</div>\
`
  );
  if (site) { $page.data('site', site); }
  return $page;
};

const showPage = (name, loc, title=null) => createPage(name, loc, title).appendTo('.main').each((_i, e) => refresh.cycle($(e)));

const doInternalLink = function(title, $page, site=null) {
  const slug = asSlug(title);
  if ($page != null) { $($page).nextAll().remove(); }
  if ($page != null) { lineup.removeAllAfterKey($($page).data('key')); }
  showPage(slug, site, title);
  return active.set($('.page').last());
};

const showResult = function(pageObject, options) {
  if (options == null) { options = {}; }
  if (options.$page != null) { $(options.$page).nextAll().remove(); }
  if (options.$page != null) { lineup.removeAllAfterKey($(options.$page).data('key')); }
  let slug = pageObject.getSlug();
  if (options.rev != null) { slug += `_rev${options.rev}`; }
  const $page = createPage(slug).addClass('ghost');
  $page.appendTo($('.main'));
  refresh.buildPage( pageObject, $page );
  return active.set($('.page').last());
};

pageEmitter.on('show', page => // console.log 'pageEmitter handling', page
showResult(page));

module.exports = {createPage, doInternalLink, showPage, showResult};
