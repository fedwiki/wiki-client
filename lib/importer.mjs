// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
// An Importer plugin completes the ghost page created upon drop of a site export file.

import * as util from './util.mjs';

import * as link from './link.mjs';
import { newPage } from './page.mjs';

const escape = text => text
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

export function emit ($item, item) {

  const render = function(pages) {
    const result = [];
    for (var slug in pages) {
      var page = pages[slug];
      var line = `<a href=${slug}>${ escape(page.title) || slug }</a>`;
      if (page.journal) {
        const date = page.journal[page.journal.length - 1].date;
        if (date ) {
          line += ` &nbsp; from ${util.formatElapsedTime(date)}`;
        } else {
          line += ` &nbsp; from revision ${page.journal.length - 1}`;
        }
      }
      result.push(line);
    }
    return result.join('<br>');
  };

  return $item.append(`\
<p style="background-color:#eee;padding:15px;">
  ${render(item.pages)}
</p>\
`
  );
};

export function bind  ($item, item) { return $item.find('a').on('click', function(e) {
  let $page;
  const slug = $(e.target).attr('href');
  if (!e.shiftKey) { $page = $(e.target).parents('.page'); }
  const pageObject = newPage(item.pages[slug]);
  link.showResult(pageObject, {$page});
  return false;
}); }

