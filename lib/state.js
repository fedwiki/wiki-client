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

state.pagesInDom = () => {
  return Array.from(document.querySelectorAll('.page')).map(el => el.id)
};

state.urlPages = () => {
  const path = new URL(window.location.href).pathname;
  return path.split('/').filter((...[, index]) => index % 2 === 1).slice(1)
};

// site is not held in DOM, but using jQuery data - so stick with jQuery for now.
state.locsInDom = () => $.makeArray($(".page").map((_, el) => $(el).data('site') || 'view')
);

state.urlLocs = () => {
  const pathname = new URL(window.location.href).pathname;
  return pathname.split('/').slice(1).filter((...[, index]) => index % 2 === 0);
}

state.setUrl = function() {
  document.title = lineup.bestTitle();
  if (history && history.pushState) {
    const locs = state.locsInDom();
    const pages = state.pagesInDom();
    const url = pages.map((page, idx) => `/${locs[idx] || 'view'}/${page}`).join('');
    if (url !== new URL(window.location.href).pathname) {
      history.pushState(null, null, url);
    }
  }
};

state.debugStates = function() {
  console.log('a .page keys ', (Array.from($('.page')).map((each) => $(each).data('key'))));
  console.log('a lineup keys', lineup.debugKeys());
};

state.show = function(e) {
  let idx, name;
  const oldPages = state.pagesInDom();
  const newPages = state.urlPages();
  const oldLocs = state.locsInDom();
  const newLocs = state.urlLocs();

  if (!location.pathname || (location.pathname === '/')) { return; }

  let matching = true;
  for (idx = 0; idx < oldPages.length; idx++) {
    if (matching && oldPages[idx] === newPages[idx]) { continue; }
    matching = false;
    const old = $('.page:last');
    lineup.removeKey(old.data('key'));
    old.remove();
  }

  matching = true;
  for (idx = 0; idx < newPages.length; idx++) {
    if (matching && (newPages[idx] === oldPages[idx])) { continue; }
    matching = false;
    link.showPage(newPages[idx], newLocs[idx]);
  }

  if (window.debug) { state.debugStates(); }

  active.set($('.page').last());
  document.title = lineup.bestTitle();
};

state.first = function() {
  state.setUrl();
  const firstUrlPages = state.urlPages();
  const firstUrlLocs = state.urlLocs();
  const oldPages = state.pagesInDom();
  for (let idx = 0; idx < firstUrlPages.length; idx++) {
    const urlPage = firstUrlPages[idx];
      if (!oldPages.includes(urlPage) && urlPage !== '') {
        link.createPage(urlPage, firstUrlLocs[idx])
      }
    }
};
