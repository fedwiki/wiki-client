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
// Page provides a factory for pageObjects, a model that combines
// the json derrived object and the site from which it came.


const {
  formatDate
} = require('./util');
const random = require('./random');
const revision = require('./revision');
const synopsis = require('./synopsis');
const wiki = require('./wiki');

// http://pragprog.com/magazines/2011-08/decouple-your-apps-with-eventdriven-coffeescript
import { EventEmitter } from 'events';

export function pageEmitter() { return new EventEmitter; }


// TODO: better home for asSlug
export function asSlug( name ) { name.replace(/\s/g, '-').replace(/[^A-Za-z0-9-]/g, '').toLowerCase(); }

export function asTitle (slug ) { slug.replace(/-/g, ' '); }

const nowSections = now => [
  {symbol: '❄', date: now-(1000*60*60*24*366), period: 'a Year'},
  {symbol: '⚘', date: now-(1000*60*60*24*31*3), period: 'a Season'},
  {symbol: '⚪', date: now-(1000*60*60*24*31), period: 'a Month'},
  {symbol: '☽', date: now-(1000*60*60*24*7), period: 'a Week'},
  {symbol: '☀', date: now-(1000*60*60*24), period: 'a Day'},
  {symbol: '⌚', date: now-(1000*60*60), period: 'an Hour'}
];

export function newPage(json, site) {
  const page = json || {};
  if (!page.title) { page.title = 'empty'; }
  if (!page.story) { page.story = []; }
  if (!page.journal) { page.journal = []; }

  const getRawPage = () => page;

  const getContext = function() {
    const context = ['view'];
    if (isRemote()) { context.push(site); }
    const addContext = function(site) { if ((site != null) && !context.includes(site)) { return context.push(site); } };
    for (var action of Array.from(page.journal.slice(0).reverse())) { addContext(action != null ? action.site : undefined); }
    return context;
  };

  const isPlugin = () => page.plugin != null;

  var isRemote = () => !([undefined, null, 'view', 'origin', 'local', 'recycler'].includes(site));

  const isLocal = () => site === 'local';

  const isRecycler = () => site === 'recycler';

  const getRemoteSite = function(host = null) {
    if (isRemote()) { return site; } else { return host; }
  };

  const getRemoteSiteDetails = function(host = null) {
    const result = [];
    if (host || isRemote()) { result.push(getRemoteSite(host)); }
    if (isPlugin()) { result.push(`${page.plugin} plugin`); }
    return result.join("\n");
  };

  const getSlug = () => asSlug(page.title);

  const getNeighbors = function(host) {
    const neighbors = [];
    if (isRemote()) {
      neighbors.push(site);
    } else {
      if (host != null) { neighbors.push(host); }
    }
    for (var item of Array.from(page.story)) {
      if ((item != null ? item.site : undefined) != null) { neighbors.push(item.site); }
    }
    for (var action of Array.from(page.journal)) {
      if ((action != null ? action.site : undefined) != null) { neighbors.push(action.site); }
    }
    return Array.from(new Set(neighbors));
  };

  const getTitle = () => page.title;

  const setTitle = title => page.title = title;

  const getRevision = () => page.journal.length-1;

  const getDate = function() {
    const action = page.journal[getRevision()];
    if (action != null) {
      if (action.date != null) {
        return action.date;
      }
    }
    return undefined;
  };

  const getTimestamp = function() {
    const action = page.journal[getRevision()];
    if (action != null) {
      if (action.date != null) {
        return formatDate(action.date);
      } else {
        return `Revision ${getRevision()}`;
      }
    } else {
      return "Unrecorded Date";
    }
  };

  const getSynopsis = () => createSynopsis(page);

  const getLinks = function() {

    let pageLinks, pageLinksMap;
    const extractPageLinks = function(collaborativeLinks, currentItem, currentIndex, array) {
      // extract collaborative links 
      // - this will need extending if we also extract the id of the item containing the link
      try {
        const linkRe = /\[\[([^\]]+)\]\]/g;
        let match = undefined;
        while ((match = linkRe.exec(currentItem.text)) !== null) {
          if (!collaborativeLinks.has(asSlug(match[1]))) {
            collaborativeLinks.set(asSlug(match[1]), currentItem.id);
          }
        }
        if ('reference' === currentItem.type) {
          if (!collaborativeLinks.has(currentItem.slug)) {
            collaborativeLinks.set(currentItem.slug, currentItem.id);
          }
        }
      } catch (err) {
        console.log(`*** Error extracting links from ${currentIndex} of ${JSON.stringify(array)}`, err.message);
      }
      return collaborativeLinks;
    };

    try {
      pageLinksMap = page.story.reduce( extractPageLinks, new Map());
    } catch (error) {
      const err = error;
      console.log(`+++ Extract links on ${page.slug} fails`, err);
    }
    if (pageLinksMap.size > 0) {
      pageLinks = Object.fromEntries(pageLinksMap);
    } else {
      pageLinks = {};
    }
    return pageLinks;
  };


  const addItem = function(item) {
    item = Object.assign({}, {id: random.itemId()}, item);
    return page.story.push(item);
  };

  const getItem = function(id) {
    for (var item of Array.from(page.story)) {
      if (item.id === id) { return item; }
    }
    return null;
  };

  const seqItems = function(each) {
    const promise = new Promise(function(resolve /*, _reject */) {
      var emitItem = function(i) {
        if (i >= page.story.length) { return resolve(); }
        return each(page.story[i]||{text:'null'}, () => emitItem(i+1));
      };
      return emitItem(0);
    });
    return promise;
  };

  const addParagraph = function(text) {
    const type = "paragraph";
    return addItem({type, text});
  };

    // page.journal.push {type: 'add'}

  const seqActions = function(each) {
    let smaller = 0;
    const sections = nowSections((new Date).getTime());
    var emitAction = function(i) {
      if (i >= page.journal.length) { return; }
      const action = page.journal[i]||{};
      const bigger = action.date || 0;
      let separator = null;
      for (var section of Array.from(sections)) {
        if ((section.date > smaller) && (section.date < bigger)) {
          separator = section;
        }
      }
      smaller = bigger;
      return each({action, separator}, () => emitAction(i+1));
    };
    return emitAction(0);
  };

  const become = function(story, journal) {
    page.story = (story != null ? story.getRawPage().story : undefined) || [];
    if (journal != null) { return page.journal = journal != null ? journal.getRawPage().journal : undefined; }
  };

  const siteLineup = function() {
    const slug = getSlug();
    const path = slug === 'welcome-visitors' ?
      "view/welcome-visitors"
    :
      `view/welcome-visitors/view/${slug}`;
    if (isRemote()) {
      // "//#{site}/#{path}"
      return wiki.site(site).getDirectURL(path);
    } else {
      return `/${path}`;
    }
  };

  const notDuplicate = function(journal, action) {
    for (var each of Array.from(journal)) {
      if ((each.id === action.id) && (each.date === action.date)) {
        return false;
      }
    }
    return true;
  };

  const merge = function(update) {
    let action;
    const merged = ((() => {
      const result = [];
      for (action of Array.from(page.journal)) {         result.push(action);
      }
      return result;
    })());
    for (action of Array.from(update.getRawPage().journal)) {
      if (notDuplicate(page.journal, action)) { merged.push(action); }
    }
    merged.push({
      type: 'fork',
      site: update.getRemoteSite(),
      date: (new Date()).getTime()
    });
    return newPage(revision.create(999, {title: page.title, journal: merged}), site);
  };

  const apply = function(action) {
    revision.apply(page, action);
    if (action.site) { return site = null; }
  };

  const getCreate = function() {
    const isCreate = action => action.type === 'create';
    return page.journal.reverse().find(isCreate);
  };

  return {getRawPage, getContext, isPlugin, isRemote, isLocal, isRecycler, getRemoteSite, getRemoteSiteDetails, getSlug, getNeighbors, getTitle, getLinks, setTitle, getRevision, getDate, getTimestamp, getSynopsis, addItem, getItem, addParagraph, seqItems, seqActions, become, siteLineup, merge, apply, getCreate};
};

