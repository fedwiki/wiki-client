// Make IndexedDB exist in Node
require('fake-indexeddb/auto');

// --- DOM via jsdom (gives window, document, location, etc.) ---
require('jsdom-global')('', { url: 'https://test/' });

const localforage = require('localforage');

// Ensure the default singleton prefers IndexedDB, then localStorage
try { localforage.setDriver([localforage.INDEXEDDB, localforage.LOCALSTORAGE]); } catch {}

// Ensure EVERY createInstance() picks a driver too
const _createInstance = localforage.createInstance.bind(localforage);
localforage.createInstance = (opts) => {
  const inst = _createInstance(opts);
  // Try IDB, then localStorage; swallow errors so tests keep running
  inst.setDriver([localforage.INDEXEDDB, localforage.LOCALSTORAGE]).catch(() => {});
  return inst;
};

// --- Proper jQuery Mock ---
// Create a proper jQuery mock that siteAdapter can use
const $ = function(selector) {
  return {
    attr: function(name, value) {
      // Mock attribute setting/getting
      if (value !== undefined) {
        this[name] = value;
        return this;
      }
      return this[name];
    },
    each: function(callback) {
      // Mock iteration
      if (callback) callback.call(this, 0, this);
      return this;
    }
  };
};

// Add ajax method to the $ function
$.ajax = function(options) {
  // Simulate a successful response for favicon requests
  if (options.url && options.url.includes('/favicon.png')) {
    if (options.success) {
      setTimeout(() => options.success(), 0);
    }
  } else {
    // Simulate error for other requests
    if (options.error) {
      setTimeout(() => options.error(), 0);
    }
  }
  
  return {
    fail: function(callback) {
      if (callback) setTimeout(callback, 0);
      return this;
    }
  };
};

global.$ = $;

// --- Canvas Mock ---
class MockCanvasRenderingContext2D {
  constructor() {
    this.fillStyle = '';
    this.strokeStyle = '';
    this.lineWidth = 0;
  }

  createRadialGradient(x0, y0, r0, x1, y1, r1) {
    return {
      addColorStop: () => {}
    };
  }

  fillRect() {}
  clearRect() {}
  beginPath() {}
  closePath() {}
  arc() {}
  fill() {}
  stroke() {}
  measureText() { return { width: 10 }; }
}

class MockCanvas {
  constructor() {
    this.width = 32;
    this.height = 32;
  }

  getContext(type) {
    if (type === '2d') {
      return new MockCanvasRenderingContext2D();
    }
    return null;
  }

  toDataURL() {
    return 'data:image/png;base64,mock';
  }
}

// Override document.createElement to return our mock canvas
const originalCreateElement = document.createElement.bind(document);
document.createElement = function(tagName) {
  if (tagName.toLowerCase() === 'canvas') {
    return new MockCanvas();
  }
  return originalCreateElement(tagName);
};

// --- Image Mock ---
let lastImageSrc = null;

class MockImage {
  constructor() {
    this.src = '';
    this.onload = null;
    this.onerror = null;
  }

  set src(value) {
    lastImageSrc = value;
    // Simulate image loading
    if (this.onload) {
      setTimeout(() => this.onload(), 0);
    }
  }
}

global.Image = MockImage;

// --- Helper functions ---
global.__getLastImageSrc = () => lastImageSrc;
global.__resetImageSrc = () => { lastImageSrc = null; };

// --- Pre-populate sitePrefix for tests ---
// Mock the siteAdapter's internal sitePrefix object
const siteAdapter = require('../lib/siteAdapter');

// Since we can't directly access the internal sitePrefix object,
// we need to mock the findAdapter function to return the expected values
const originalFindAdapter = siteAdapter.findAdapter;

// Mock findAdapter to immediately return the expected prefixes
siteAdapter.findAdapter = function(site, done) {
  const prefixes = {
    '127.0.0.1:3001': 'http://127.0.0.1:3001',
    '[::1]:4000': 'http://[::1]:4000',
    'sub.localhost:3000': 'http://sub.localhost:3000',
    'example.com': '//example.com'
  };
  
  const prefix = prefixes[site] || '';
  done(prefix);
};

// --- Location Mock ---
if (typeof window !== 'undefined') {
  window.location = {
    host: 'test',
    hostname: 'test', 
    protocol: 'https:',
    origin: 'https://test',
    href: 'https://test/'
  };
}