// The license module explains federated wiki license terms
// including the proper attribution of collaborators.

import resolve from './resolve.cjs';
import lineup from './lineup.cjs';

function cc () { return `\
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
}

function authors (page, site) {
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

function provenance (action) {
  if (!action?.provenance) { return ""; }
  return `\
<p>
  Created From:
</p><p>
  ${resolve.resolveLinks(action.provenance)}
</p>\
`;
};

export function info ($page) {
  const pageObject = lineup.atKey($page.data('key'));
  const page = pageObject.getRawPage();
  const site = pageObject.getRemoteSite(location.hostname);
  return cc() +
  authors(page, site) +
  provenance(page.journal[0]);
};

