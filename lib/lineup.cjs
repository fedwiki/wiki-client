// The lineup represents a sequence of pages with possible
// duplication. We maintain the lineup in parallel with
// the DOM list of .page elements. Eventually lineup will
// play a more central role managing calculations and
// display updates.

const {randomBytes} = require('./random.mjs');

let pageByKey = {};
let keyByIndex = [];


// Basic manipulations that correspond to typical user activity

const addPage = function(pageObject) {
  const key = randomBytes(4);
  pageByKey[key] = pageObject;
  keyByIndex.push(key);
  return key;
};

const changePageIndex = function(key, newIndex) {
  const oldIndex = keyByIndex.indexOf(key);
  keyByIndex.splice(oldIndex, 1);
  keyByIndex.splice(newIndex, 0, key);
};

const removeKey = function(key) {
  if (!keyByIndex.includes(key)) { return null; }
  keyByIndex = keyByIndex.filter(each => key !== each);
  delete pageByKey[key];
  return key;
};

const removeAllAfterKey = function(key) {
  const result = [];
  if (!keyByIndex.includes(key)) { return result; }
  while (keyByIndex[keyByIndex.length-1] !== key) {
    var unwanted = keyByIndex.pop();
    result.unshift(unwanted);
    delete pageByKey[unwanted];
  }
  return result;
};

const atKey = key => pageByKey[key];

const titleAtKey = key => atKey(key).getTitle();

const bestTitle = function() {
  if (!keyByIndex.length) { return "Wiki"; }
  return titleAtKey(keyByIndex[keyByIndex.length-1]);
};


// Debug access to internal state used by unit tests.

const debugKeys = () => keyByIndex;

const debugReset = function() {
  pageByKey = {};
  keyByIndex = [];
};


// Debug self-check which corrects misalignments until we get it right

const debugSelfCheck = function(keys) {
  let have, keysByIndex, want;
  if ((have = `${keyByIndex}`) === (want = `${keys}`)) { return; }
  console.log('The lineup is out of sync with the dom.');
  console.log(".pages:", keys);
  console.log("lineup:", keyByIndex);
  if (`${Object.keys(keyByIndex).sort()}` !== `${Object.keys(keys).sort()}`) { return; }
  console.log('It looks like an ordering problem we can fix.');
  keysByIndex = keys;
};


// Select a few crumbs from the lineup that will take us
// close to welcome-visitors on a (possibly) remote site.

const leftKey = function(key) {
  const pos = keyByIndex.indexOf(key);
  if (pos < 1) { return null; }
  return keyByIndex[pos-1];
};

const crumbs = function(key, location) {
  let left, slug;
  const page = pageByKey[key];
  const host = page.getRemoteSite(location);
  const result = ['view', (slug = page.getSlug())];
  if (slug !== 'welcome-visitors') { result.unshift('view', 'welcome-visitors'); }
  if ((host !== location) && (left = leftKey(key))) {
    let adjacent;
    if (!(adjacent = pageByKey[left]).isRemote()) {
      result.push(location, adjacent.getSlug());
    }
  }
  result.unshift(host);
  return result;
};


module.exports = {addPage, changePageIndex, removeKey, removeAllAfterKey, atKey, titleAtKey, bestTitle, debugKeys, debugReset, crumbs, debugSelfCheck};
