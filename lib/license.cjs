// The license module explains federated wiki license terms
// including the proper attribution of collaborators.

const resolve = require('./resolve.cjs');
const lineup = require('./lineup.cjs');

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
  if (!page.journal) { return ""; }
  const done = {};
  const list = [];
  for (var action of page.journal.slice(0).reverse()) {
    if (action.site) { site = action.site; }
    if (action.attribution?.site) { site = action.attribution.site; }
    if ((action.type !== 'fork') && !done[site]) {
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
  if (!action?.provenance) { return ""; }
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
