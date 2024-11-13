// An Importer plugin completes the ghost page created upon drop of a site export file.

const {formatElapsedTime} = require('./util.mjs');
const link = require('./link.cjs');
const {
  newPage
} = require('./page.cjs');

const escape = text => text
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

const emit = function($item, item) {

  const render = function(pages) {
    const result = [];
    for (var slug in pages) {
      var page = pages[slug];
      var line = `<a href=${slug}>${ escape(page.title) || slug }</a>`;
      if (page.journal) {
        var date;
        if (date = page.journal[page.journal.length - 1].date) {
          line += ` &nbsp; from ${formatElapsedTime(date)}`;
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

const bind = ($item, item) => $item.find('a').on('click', function(e) {
  let $page;
  const slug = $(e.target).attr('href');
  if (!e.shiftKey) { $page = $(e.target).parents('.page'); }
  const pageObject = newPage(item.pages[slug]);
  link.showResult(pageObject, {$page});
});

module.exports = {emit, bind};
