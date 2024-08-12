// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
// The license module explains federated wiki license terms
// including the proper attribution of collaborators.

const resolve = require('./resolve');
const lineup = require('./lineup');

const cc = () => `\
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
</p>\
`;

const authors = function(page, site) {
  if (page.journal == null) { return ""; }
  const done = {};
  const list = [];
  for (var action of Array.from(page.journal.slice(0).reverse())) {
    if (action.site != null) { ({
      site
    } = action); }
    if ((action.attribution != null ? action.attribution.site : undefined) != null) { ({
      site
    } = action.attribution); }
    if ((action.type !== 'fork') && (done[site] == null)) {
      var siteURL = wiki.site(site).getDirectURL("");
      var siteFlag = wiki.site(site).flag();
      list.push(`<a href="${siteURL}" target="_blank"><img class="remote" title="${site}" src="${siteFlag}"> ${site}</a>`);
      done[site] = true;
    }
  }
  if (!(list.length > 0)) { return ""; }
  return `\
<p>
  Author's Sites:
</p><p>
  ${list.join("<br>")}
</p>\
`;
};

const provenance = function(action) {
  if ((action != null ? action.provenance : undefined) == null) { return ""; }
  return `\
<p>
  Created From:
</p><p>
  ${resolve.resolveLinks(action.provenance)}
</p>\
`;
};

const info = function($page) {
  const pageObject = lineup.atKey($page.data('key'));
  const page = pageObject.getRawPage();
  const site = pageObject.getRemoteSite(location.hostname);
  return cc() +
  authors(page, site) +
  provenance(page.journal[0]);
};


module.exports = {info};
