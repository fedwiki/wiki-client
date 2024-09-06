// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
// The search module invokes neighborhood's query function,
// formats the results as story items, and then opens a
// page to present them.

const pageHandler = require('./pageHandler');
const random = require('./random');
const link = require('./link');
//const active = require('./active');
const {
  newPage
} = require('./page');
const resolve = require('./resolve');
let page = require('./page');
const wiki = require('./wiki');

// from: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
//const escapeRegExp = string => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const deepCopy = object => JSON.parse(JSON.stringify(object));

// From reference.coffee
const emit = function($item, item) {
  let {
    slug
  } = item;
  if (item.title != null) { if (!slug) { slug = page.asSlug(item.title); } }
  if (!slug) { slug = 'welcome-visitors'; }
  const {
    site
  } = item;
  return resolve.resolveFrom(site, () => $item.append(`\
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
</p>\
`
  ));
};
const finishClick = function(e, name) {
  e.preventDefault();
  if (!e.shiftKey) { page = $(e.target).parents('.page'); }
  link.doInternalLink(name, page, $(e.target).data('site'));
  return false;
};

const createSearch = function({neighborhood}){
  const incrementalSearch = function(searchQuery){
    if (searchQuery.length < 2) {
      $('.incremental-search').remove();
      return;
    }
    if ($('.incremental-search').length === 0) {
      const offset = $('.searchbox').position();
      $('<div/>')
        .css('left', `${offset.left}px`)
        .css('bottom', `${offset.top + $('.searchbox').height()}px`)
        .addClass('incremental-search')
        .on('click', '.internal', function(e) {
          if (e.target.nodeName === 'SPAN') { e.target = $(e.target).parent()[0]; }
          let name = $(e.target).data('pageName');
          // ensure that name is a string (using string interpolation)
          name = `${name}`;
          pageHandler.context = $(e.target).attr('title').split(' => ');
          return finishClick(e, name);
      }).on('click', 'img.remote', function(e) {
          // expand to handle click on temporary flag
          if ($(e.target).attr('src').startsWith('data:image/png')) {
            e.preventDefault();
            const site = $(e.target).data('site');
            return wiki.site(site).refresh(function() {});
              // empty function...
          } else {
            const name = $(e.target).data('slug');
            pageHandler.context = [$(e.target).data('site')];
            return finishClick(e, name);
          }
        }).appendTo($('.searchbox'));
    }

    const searchResults = neighborhood.search(searchQuery);
    const searchTerms = searchQuery.split(' ')
            .map(t => t.toLowerCase()).filter(String);
    const searchHighlightRegExp = new RegExp("\\b(" + searchQuery.split(' ')
            .map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).filter(String)
            .join('|') + ")", 'i');
    const highlightText = text => text.split(searchHighlightRegExp)
      .map(function(p) {
        if (searchTerms.includes(p.toLowerCase())) {
          return `{{${p}}}`;
        } else { return p; }}).join('');
    const $search = $('.incremental-search').empty();
    if (!searchResults.finds || (searchResults.finds.length === 0)) {
      $('<div/>').text('No results found').addClass('no-results').appendTo($search);
    }
    let count = 0;
    const max_results = 100;
    return (() => {
      const result1 = [];
      for (var result of Array.from(searchResults.finds)) {
        count += 1;
        if (count === (max_results + 1)) {
          $('<div/>').text(`${searchResults.finds.length - max_results} results omitted`).addClass('omitted-results').appendTo($search);
        }
        if (count > max_results) {
          continue;
        }
        var $item = $('<div/>').appendTo($search);
        var item = {
          id: random.itemId(),
          type: "reference",
          site: result.site,
          slug: result.page.slug,
          title: highlightText(result.page.title),
          text: highlightText(result.page.synopsis)
        };
        emit($item, item);
        result1.push($item.html($item.html()
          .split(new RegExp("({{.*?}})", 'i'))
          .map(function(p) {
            if ((p.indexOf('{{')) === 0) {
              return `<span class='search-term'>${p.substring(2, p.length - 2)}</span>`;
            } else { return p; }}).join('')
        ));
      }
      return result1;
    })();
  };

  const performSearch = function(searchQuery){
    const searchResults = neighborhood.search(searchQuery);
    if (searchResults.finds && (searchResults.finds.length === 1)) {
      $('.incremental-search').find('.internal').trigger('click');
      $('.incremental-search').remove();
      return;
    }
    $('.incremental-search').remove();
    const {
      tally
    } = searchResults;
    const resultPage = {};
    resultPage.title = `Search for '${searchQuery}'`;
    resultPage.story = [];
    resultPage.story.push({
      'type': 'paragraph',
      'id': random.itemId(),
      'text': `\
String '${searchQuery}' found on ${tally.finds||'none'} of ${tally.pages||'no'} pages from ${tally.sites||'no'} sites.
Text matched on ${tally.title||'no'} titles, ${tally.text||'no'} paragraphs, and ${tally.slug||'no'} slugs.
Elapsed time ${tally.msec} milliseconds.\
` });
    for (var result of Array.from(searchResults.finds)) {
      resultPage.story.push({
        "id": random.itemId(),
        "type": "reference",
        "site": result.site,
        "slug": result.page.slug,
        "title": result.page.title,
        "text": result.page.synopsis || ''
      });
    }

    resultPage.journal = [{
      "type": "create",
      "item": {
        "title": resultPage.title,
        "story": deepCopy(resultPage.story)
      },
      "date": Date.now()
    }];
    const pageObject = newPage(resultPage);
    return link.showResult(pageObject);
  };


  return {
    incrementalSearch,
    performSearch
  };
};
module.exports = createSearch;
