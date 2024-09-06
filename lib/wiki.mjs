// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
// We have exposed many parts of the core javascript to dynamically
// loaded plugins through bindings in the global "wiki". We expect
// to deprecate many of these as the plugin api matures. We once used
// the global to communicate between core modules but have now
// moved all of that responsibility onto browserify.

// We have canvased plugin repos in github.com/fedwiki to find
// the known uses of wiki globals. We notice that most entry
// points are used. We mark unused entries with ##.

// known use: (eventually all server directed xhr and some tags)

import * as siteAdapter from './siteAdapter.mjs';

export const local = siteAdapter.local;
export const origin = siteAdapter.origin;
export const recycler = siteAdapter.recycler;
export const site = siteAdapter.site;

// known use: wiki.asSlug wiki-plugin-reduce/client/reduce.coffee:

import { asSlug as asSlug_, newPage as newPage_ } from './page.mjs';
export const asSlug = asSlug_;
export const newPage = newPage_;

// known use: wiki.createItem wiki-plugin-parse/client/parse.coffee:
// known use: wiki.removeItem wiki-plugin-parse/client/parse.coffee:
// known use: wiki.getItem  wiki-plugin-changes/client/changes.coffee:

import * as itemz from './itemz.mjs';

export const removeItem = itemz.removeItem;
export const createItem = itemz.createItem;
export const getItem = itemz.getItem;

// known use: wiki.dialog wiki-plugin-changes/client/changes.coffee:
// known use: wiki.dialog wiki-plugin-chart/client/chart.coffee:
// known use: wiki.dialog wiki-plugin-data/client/data.coffee:
// known use: wiki.dialog wiki-plugin-efficiency/client/efficiency.coffee:
// known use: wiki.dialog wiki-plugin-linkmap/client/linkmap.coffee:
// known use: wiki.dialog wiki-plugin-method/client/method.coffee:
// known use: wiki.dialog wiki-plugin-radar/client/radar.coffee:
// known use: wiki.dialog wiki-plugin-reduce/client/reduce.coffee:
// known use: wiki.dialog wiki-plugin-txtzyme/client/txtzyme.coffee:

import * as dialog_ from './dialog.mjs';

export const dialog = dialog_.open;

// known use: wiki.doInternalLink wiki-plugin-force/client/force.coffee:
// known use: wiki.doInternalLink wiki-plugin-radar/client/radar.coffee:

import * as link from './link.mjs';

export const createPage = link.createPage; //#
export const doInternalLink = link.doInternalLink;
export const showResult = link.showResult;

// known use: wiki.getScript  wiki-plugin-bars/client/bars.coffee:
// known use: wiki.getScript  wiki-plugin-code/client/code.coffee:
// known use: wiki.getScript  wiki-plugin-force/client/force.coffee:
// known use: wiki.getScript  wiki-plugin-line/client/line.coffee:
// known use: wiki.getScript  wiki-plugin-map/client/map.coffee:
// known use: wiki.getScript  wiki-plugin-mathjax/client/mathjax.coffee:
// known use: wiki.getScript  wiki-plugin-pushpin/client/pushpin.coffee:
// known use: wiki.getScript  wiki-plugin-radar/client/radar.coffee:
// known use: wiki.getPlugin  wiki-plugin-reduce/client/reduce.coffee:
// known use: wiki.doPlugin wiki-plugin-changes/client/changes.coffee:
// known use: wiki.registerPlugin wiki-plugin-changes/client/changes.coffee:

import plugin from './plugin.mjs';

export const getScript = plugin.getScript;
export const getPlugin = plugin.getPlugin;
export const doPlugin = plugin.doPlugin;
export const registerPlugin = plugin.registerPlugin;
export const renderFrom = plugin.renderFrom;

// known use: wiki.getData  wiki-plugin-bars/client/bars.coffee:
// known use: wiki.getData  wiki-plugin-calculator/client/calculator.coffee:
// known use: wiki.getData  wiki-plugin-force/client/force.coffee:
// known use: wiki.getData  wiki-plugin-line/client/line.coffee:

export const getData = function(vis) {
  let who;
  if (vis) {
    const idx = $('.item').index(vis);
    who = $(`.item:lt(${idx})`).filter('.chart,.data,.calculator').last();
    if (who != null) { return who.data('item').data; } else { return {}; }
  } else {
    who = $('.chart,.data,.calculator').last();
    if (who != null) { return who.data('item').data; } else { return {}; }
  }
};

// known use: wiki.getDataNodes wiki-plugin-metabolism/client/metabolism.coffee:
// known use: wiki.getDataNodes wiki-plugin-method/client/method.coffee:

export const getDataNodes = function(vis) {
  let who;
  if (vis) {
    const idx = $('.item').index(vis);
    who = $(`.item:lt(${idx})`).filter('.chart,.data,.calculator').toArray().reverse();
    return $(who);
  } else {
    who = $('.chart,.data,.calculator').toArray().reverse();
    return $(who);
  }
};

// known use: wiki.log  wiki-plugin-calculator/client/calculator.coffee:
// known use: wiki.log  wiki-plugin-calendar/client/calendar.coffee:
// known use: wiki.log  wiki-plugin-changes/client/changes.coffee:
// known use: wiki.log  wiki-plugin-efficiency/client/efficiency.coffee:
// known use: wiki.log  wiki-plugin-parse/client/parse.coffee:
// known use: wiki.log  wiki-plugin-radar/client/radar.coffee:
// known use: wiki.log  wiki-plugin-txtzyme/client/txtzyme.coffee:

export const log = function(...things) {
  if ((typeof console !== 'undefined' && console !== null ? console.log : undefined) != null) { return console.log(...Array.from(things || [])); }
};

// known use: wiki.neighborhood wiki-plugin-activity/client/activity.coffee:
// known use: wiki.neighborhoodObject  wiki-plugin-activity/client/activity.coffee:
// known use: wiki.neighborhoodObject  wiki-plugin-roster/client/roster.coffee:


import { Neighborhood } from './neighborhood.mjs';
let neighborhood_ = new Neighborhood();

export const neighborhood = neighborhood_.sites;
export const neighborhoodObject = neighborhood_;

// known use: wiki.pageHandler  wiki-plugin-changes/client/changes.coffee:
// known use: wiki.pageHandler  wiki-plugin-map/client/map.coffee:

import { PageHandler } from './pageHandler.mjs';
const pageHandler_ = new PageHandler();

export const pageHandler = pageHandler_;
export const useLocalStorage = pageHandler_.useLocalStorage; //#

// known use: wiki.resolveFrom  wiki-plugin-federatedwiki/client/federatedWiki.coffee:
// known use: wiki.resolveLinks wiki-plugin-chart/client/chart.coffee:
// known use: wiki.resolveLinks wiki-plugin-data/client/data.coffee:
// known use: wiki.resolveLinks wiki-plugin-efficiency/client/efficiency.coffee:
// known use: wiki.resolveLinks wiki-plugin-federatedwiki/client/federatedWiki.coffee:
// known use: wiki.resolveLinks wiki-plugin-logwatch/client/logwatch.coffee:
// known use: wiki.resolveLinks wiki-plugin-mathjax/client/mathjax.coffee:

import { Resolve } from './resolve.mjs';

const resolve = new Resolve();

export const resolveFrom = resolve.resolveFrom;
export const resolveLinks = resolve.resolveLinks;
export const resolutionContext = resolve.resolutionContext; //#

// known use: wiki.textEditor wiki-plugin-bytebeat/client/bytebeat.coffee:
// known use: wiki.textEditor wiki-plugin-calculator/client/calculator.coffee:
// known use: wiki.textEditor wiki-plugin-calendar/client/calendar.coffee:
// known use: wiki.textEditor wiki-plugin-code/client/code.coffee:
// known use: wiki.textEditor wiki-plugin-data/client/data.coffee:
// known use: wiki.textEditor wiki-plugin-efficiency/client/efficiency.coffee:
// known use: wiki.textEditor wiki-plugin-federatedwiki/client/federatedWiki.coffee:
// known use: wiki.textEditor wiki-plugin-mathjax/client/mathjax.coffee:
// known use: wiki.textEditor wiki-plugin-metabolism/client/metabolism.coffee:
// known use: wiki.textEditor wiki-plugin-method/client/method.coffee:
// known use: wiki.textEditor wiki-plugin-pagefold/client/pagefold.coffee:
// known use: wiki.textEditor wiki-plugin-parse/client/parse.coffee:
// known use: wiki.textEditor wiki-plugin-radar/client/radar.coffee:
// known use: wiki.textEditor wiki-plugin-reduce/client/reduce.coffee:
// known use: wiki.textEditor wiki-plugin-txtzyme/client/txtzyme.coffee:

import * as editor from './editor.mjs';

export const textEditor = editor.textEditor;

// known use: wiki.util wiki-plugin-activity/client/activity.coffee:

import * as util_ from './util.mjs';
export const util = util_;

// known use: wiki.security views/static.html
import * as security_ from './security.mjs';
export const security = security_;


// known use: require wiki-clint/lib/synopsis wiki-node-server/lib/page.coffee
// known use: require wiki-clint/lib/synopsis wiki-node-server/lib/leveldb.js
// known use: require wiki-clint/lib/synopsis wiki-node-server/lib/mongodb.js
// known use: require wiki-clint/lib/synopsis wiki-node-server/lib/redis.js

import * as synopsis_ from './synopsis.mjs';
export const createSynopsis = synopsis_;

// known uses: (none yet)
import * as lineup_ from './lineup.mjs';
export const lineup = lineup_;

