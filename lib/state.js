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
// The state module saves the .page lineup in the browser's location
// bar and history. It also reconstructs that state when the browser
// notifies us that the user has changed this sequence.

let state;
const active = require('./active');
const lineup = require('./lineup');
let link = null;

module.exports = (state = {});

// FUNCTIONS and HANDLERS to manage location bar and back button

state.inject = link_ => link = link_;

state.pagesInDom = () => $.makeArray($(".page").map((_, el) => el.id));

state.urlPages = () => ((() => {
  const result = [];
  const iterable = $(location).attr('pathname').split('/');
  for (let j = 0; j < iterable.length; j += 2) {
    var i = iterable[j];
    result.push(i);
  }
  return result;
})()).slice(1);

state.locsInDom = () => $.makeArray($(".page").map((_, el) => $(el).data('site') || 'view')
);

state.urlLocs = () => (() => {
  const result = [];
  const iterable = $(location).attr('pathname').split('/').slice(1);
  for (let i = 0; i < iterable.length; i += 2) {
    var j = iterable[i];
    result.push(j);
  }
  return result;
})();

state.setUrl = function() {
  document.title = lineup.bestTitle();
  if (history && history.pushState) {
    const locs = state.locsInDom();
    const pages = state.pagesInDom();
    const url = (Array.from(pages).map((page, idx) => `/${(locs != null ? locs[idx] : undefined) || 'view'}/${page}`)).join('');
    if (url !== $(location).attr('pathname')) {
      return history.pushState(null, null, url);
    }
  }
};

state.debugStates = function() {
  console.log('a .page keys ', (Array.from($('.page')).map((each) => $(each).data('key'))));
  return console.log('a lineup keys', lineup.debugKeys());
};

state.show = function() {
  let idx, name;
  const oldPages = state.pagesInDom();
  const newPages = state.urlPages();
//  const oldLocs = state.locsInDom();
  const newLocs = state.urlLocs();

  if (!location.pathname || (location.pathname === '/')) { return; }

  let matching = true;
  for (idx = 0; idx < oldPages.length; idx++) {
    name = oldPages[idx];
    if (matching && (matching = name === newPages[idx])) { continue; }
    var old = $('.page:last');
    lineup.removeKey(old.data('key'));
    old.remove();
  }

  matching = true;
  for (idx = 0; idx < newPages.length; idx++) {
    name = newPages[idx];
    if (matching && (matching = name === oldPages[idx])) { continue; }
    // console.log 'push', idx, name
    link.showPage(name, newLocs[idx]);
  }

  if (window.debug) { state.debugStates(); }

  active.set($('.page').last());
  return document.title = lineup.bestTitle();
};

state.first = function() {
  state.setUrl();
  const firstUrlPages = state.urlPages();
  const firstUrlLocs = state.urlLocs();
  const oldPages = state.pagesInDom();
  return (() => {
    const result = [];
    for (let idx = 0; idx < firstUrlPages.length; idx++) {
      var urlPage = firstUrlPages[idx];
      if (!Array.from(oldPages).includes(urlPage)) {
        if (urlPage !== '') { result.push(link.createPage(urlPage, firstUrlLocs[idx])); } else {
          result.push(undefined);
        }
      }
    }
    return result;
  })();
};

