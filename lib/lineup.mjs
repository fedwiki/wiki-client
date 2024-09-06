// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
// The lineup represents a sequence of pages with possible
// duplication. We maintain the lineup in parallel with
// the DOM list of .page elements. Eventually lineup will
// play a more central role managing calculations and
// display updates.

import * as random from './random.mjs';

let pageByKey = {};
let keyByIndex = [];


// Basic manipulations that correspond to typical user activity

export function addPage (pageObject) {
  const key = random.randomBytes(4);
  pageByKey[key] = pageObject;
  keyByIndex.push(key);
  return key;
};

export function changePageIndex (key, newIndex) {
  const oldIndex = keyByIndex.indexOf(key);
  keyByIndex.splice(oldIndex, 1);
  return keyByIndex.splice(newIndex, 0, key);
};

export function removeKey (key) {
  if (!Array.from(keyByIndex).includes(key)) { return null; }
  keyByIndex = keyByIndex.filter(each => key !== each);
  delete pageByKey[key];
  return key;
};

export function removeAllAfterKey (key) {
  const result = [];
  if (!Array.from(keyByIndex).includes(key)) { return result; }
  while (keyByIndex[keyByIndex.length-1] !== key) {
    var unwanted = keyByIndex.pop();
    result.unshift(unwanted);
    delete pageByKey[unwanted];
  }
  return result;
};

export function atKey (key ) { return pageByKey[key]; }

export function titleAtKey ( key ) { return atKey(key).getTitle(); }

export function bestTitle () {
  if (!keyByIndex.length) { return "Wiki"; }
  return titleAtKey(keyByIndex[keyByIndex.length-1]);
};


// Debug access to internal state used by unit tests.

export function debugKeys() { return keyByIndex; }

export function debugReset () {
  pageByKey = {};
  return keyByIndex = [];
};


// Debug self-check which corrects misalignments until we get it right

export function debugSelfCheck (keys) {
  const have = `${keyByIndex}`;
  const want = `${keys}`;
  if (have === want ) { return; }
  console.log('The lineup is out of sync with the dom.');
  console.log(".pages:", keys);
  console.log("lineup:", keyByIndex);
  if (`${Object.keys(keyByIndex).sort()}` !== `${Object.keys(keys).sort()}`) { return; }
  console.log('It looks like an ordering problem we can fix.');
  return keys;
};


// Select a few crumbs from the lineup that will take us
// close to welcome-visitors on a (possibly) remote site.

export function leftKey (key) {
  const pos = keyByIndex.indexOf(key);
  if (pos < 1) { return null; }
  return keyByIndex[pos-1];
};

export function crumbs (key, location) {
  let left, slug;
  const page = pageByKey[key];
  const host = page.getRemoteSite(location);
  const result = ['view', (slug = page.getSlug())];
  if (slug !== 'welcome-visitors') { result.unshift('view', 'welcome-visitors'); }
  if ((host !== location) && ((left = leftKey(key)) != null)) {
    let adjacent;
    if (!(adjacent = pageByKey[left]).isRemote()) {
      result.push(location, adjacent.getSlug());
    }
  }
  result.unshift(host);
  return result;
};


