// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
// The siteAdapter handles fetching resources from sites, including origin
// and local browser storage.

let siteAdapter;
const queue = require('async/queue');
const localForage = require('localforage');

module.exports = (siteAdapter = {});

// we save the site prefix once we have determined it,
const sitePrefix = {};
// and if the CORS request requires credentials...
const credentialsNeeded = {};

// when asked for a site's flag, if we don't know the current prefix we create
// a temporary greyscale flag. We save them here, so we can replace them when
// we know how to get a site's flag
const tempFlags = {};

// some settings
const fetchTimeoutMS = 3000;
const findQueueWorkers = 8;

console.log("siteAdapter: loading data");
const routeStore = localForage.createInstance({ name: "routes" });
routeStore.iterate(function(value, key, iterationNumber) {
  sitePrefix[key] = value;
  }).then(() => console.log("siteAdapter: data loaded")).catch(err => console.log("siteAdapter: error loading data ", err));

const withCredsStore = localForage.createInstance({name: "withCredentials" });
withCredsStore.iterate(function(value, key, iterationNumber) {
  credentialsNeeded[key] = value;
  }).then(() => console.log("siteAdapter: withCredentials data loaded")).catch(err => console.log("siteAdapter: error loading withCredentials data ", err));

const testWikiSite = function(url, good, bad) {
  let testRace;
  const fetchTimeout = new Promise( function(resolve, reject) {
    let id;
    return id = setTimeout( function() {
      clearTimeout(id);
      return reject();
    }
    , fetchTimeoutMS);
  });

  const fetchURL = new Promise( (resolve, reject) => $.ajax({
    type: 'GET',
    url,
    success() { return resolve(); },
    error() { return reject(); }}));

  return testRace = Promise.race([
    fetchTimeout,
    fetchURL
    ])
  .then(() => good())
  .catch(() => bad());
};




const findAdapterQ = queue( function(task, done) {
  let testURL;
  const {
    site
  } = task;
  if (sitePrefix[site] != null) {
    done(sitePrefix[site]);
  }

  if (site.split('.').at(-1).split(':')[0] === 'localhost') {
    testURL = `http://${site}/favicon.png`;
  } else {
    testURL = `//${site}/favicon.png`;
  }
  return testWikiSite(testURL, (function() {
    sitePrefix[site] = testURL.slice(0,-12);
    return done(testURL.slice(0,-12));
  }), function() {
    switch (location.protocol) {
      case 'http:':
        testURL = `https://${site}/favicon.png`;
        return testWikiSite(testURL, (function() {
          sitePrefix[site] = `https://${site}`;
          return done(`https://${site}`);
        }), function() {
          sitePrefix[site] = "";
          return done("");
        });
      case 'https:':
        testURL = `/proxy/${site}/favicon.png`;
        return testWikiSite(testURL, (function() {
          sitePrefix[site] = `/proxy/${site}`;
          return done(`/proxy/${site}`);
        }), function() {
          sitePrefix[site] = "";
          return done("");
        });
      default:
        sitePrefix[site] = "";
        return done("");
    }
  });
}
, findQueueWorkers); // start with just 1 process working on the queue

const findAdapter = (site, done) => routeStore.getItem(site).then(function(value) {
  // console.log "findAdapter: ", site, value
  if ((value == null)) {
    return findAdapterQ.push({site}, function(prefix) {
      sitePrefix[site] = prefix;
      return routeStore.setItem(site, prefix).then(value => done(prefix)).catch(function(err) {
        console.log("findAdapter setItem error: ", site, err);
        return done(prefix);
      });
    });
  } else {
    sitePrefix[site] = value;
    return done(value);
  }}).catch(function(err) {
  console.log("findAdapter error: ", site, err);
  sitePrefix[site] = "";
  return done("");
});



siteAdapter.local = {
  flag() { return "/favicon.png"; },
  getURL(route) { return `/${route}`; },
  getDirectURL(route) { return `/${route}`; },
  get(route, callback) {
    let page;
    const done = function(err, value) { if (callback) { return callback(err, value); } };

    // console.log "wiki.local.get #{route}"
    if (page = localStorage.getItem(route.replace(/\.json$/,''))) {
      const parsedPage = JSON.parse(page);
      done(null, parsedPage);
      if (!callback) { return Promise.resolve(parsedPage); }
    } else {
      const errMsg = {msg: `no page named '${route}' in browser local storage`};
      done(errMsg, null);
      // console.log("tried to local fetch a page that isn't local")
      if (!callback) { return Promise.reject(errMsg); }
    }
  },
  put(route, data, done) {
    // console.log "wiki.local.put #{route}"
    localStorage.setItem(route, JSON.stringify(data));
    return done();
  },
  delete(route) {
    // console.log "wiki.local.delete #{route}"
    return localStorage.removeItem(route);
  }
};

siteAdapter.origin = {
  flag() { return "/favicon.png"; },
  getURL(route) { return `/${route}`; },
  getDirectURL(route) { return `/${route}`; },
  get(route, callback) {
    const done = function(err, value) { if (callback) { return callback(err, value); } };
    // console.log "wiki.origin.get #{route}"
    return $.ajax({
      type: 'GET',
      dataType: 'json',
      url: `/${route}`,
      success(page, code, xhr) {
        if (route === 'system/sitemap.json') {
          return done(null, { data: page, lastModified: Date.parse(xhr.getResponseHeader('Last-Modified') )});
        } else {
          return done(null, page);
        }
      },
      error(xhr, type, msg) { return done({msg, xhr}, null); }
    });
  },
  getIndex(route, callback) {
    const done = function(err, value) { if (callback) { return callback(err, value); } };
    // console.log "wiki.origin.get #{route}"
    return $.ajax({
      type: 'GET',
      dataType: 'text',
      url: `/${route}`,
      success(page) { return done(null, page); },
      error(xhr, type, msg) { return done({msg, xhr}, null); }
    });
  },
  put(route, data, done) {
    // console.log "wiki.orgin.put #{route}"
    return $.ajax({
      type: 'PUT',
      url: `/page/${route}/action`,
      data: {
        'action': JSON.stringify(data)
      },
      success() { return done(null); },
      error(xhr, type, msg) { return done({xhr, type, msg}); }});
  },
  delete(route, done) {
    // console.log "wiki.origin.delete #{route}"
    return $.ajax({
      type: 'DELETE',
      url: `/${route}`,
      success() { return done(null); },
      error(xhr, type, msg) { return done({xhr, type, msg}); }});
  }
};

siteAdapter.recycler = {
  flag() { return "/recycler/favicon.png"; },
  getURL(route) { return `/recycler/${route}`; },
  getDirectURL(route) { return `/recycler/${route}`; },
  get(route, callback) {
    const done = function(err, value) { if (callback) { return callback(err, value); } };
    // console.log "wiki.recycler.get #{route}"
    return $.ajax({
      type: 'GET',
      dataType: 'json',
      url: `/recycler/${route}`,
      success(page) { return done(null, page); },
      error(xhr, type, msg) { return done({msg, xhr}, null); }
    });
  },
  delete(route, done) {
    // console.log "wiki.recycler.delete #{route}"
    return $.ajax({
      type: 'DELETE',
      url: `/recycler/${route}`,
      success() { return done(null); },
      error(xhr, type, msg) { return done({xhr, type, msg}); }});
  }
};

siteAdapter.site = function(site) {
  if (!site || (site === window.location.host)) { return siteAdapter.origin; }
  if (site === 'recycler') { return siteAdapter.recycler; }

  const createTempFlag = function(site) {
    // console.log "creating temp flag for #{site}"
    const myCanvas = document.createElement('canvas');
    myCanvas.width = 32;
    myCanvas.height = 32;

    const ctx = myCanvas.getContext('2d');

    const x1 = Math.random() * 32;
    const y1 = x1;
    const y2 = Math.random() * 32;
    const x2 = 32 - y2;

    const c1 = ((Math.random() * 0xFF)<<0).toString(16);
    const c2 = ((Math.random() * 0xFF)<<0).toString(16);

    const color1 = '#' + c1 + c1 + c1;
    const color2 = '#' + c2 + c2 + c2;


    const gradient = ctx.createRadialGradient(x1,y1,32,x2,y2,0);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    ctx.fillStyle = gradient;
    ctx.fillRect(0,0,32,32);
    return myCanvas.toDataURL();
  };

  return {
    flag() {
      if (sitePrefix[site] != null) {
        if (sitePrefix[site] === "") {
          if (tempFlags[site] != null) {
            return tempFlags[site];
          } else {
            return tempFlags[site] = createTempFlag(site);
          }
        } else {
          // we already know how to construct flag url
          return sitePrefix[site] + "/favicon.png";
        }
      } else if (tempFlags[site] != null) {
        // we already have a temp. flag
        return tempFlags[site];
      } else {
        // we don't know the url to the real flag, or have a temp flag

//        findAdapterQ.push {site: site}, (prefix) ->
        findAdapter(site, function(prefix) {
          if (prefix === "") {
            return console.log(`Prefix for ${site} is undetermined...`);
          } else {
            console.log(`Prefix for ${site} is ${prefix}`);
            // replace temp flags
            const tempFlag = tempFlags[site];
            const realFlag = sitePrefix[site] + "/favicon.png";
            // replace temporary flag where it is used as an image
            $('img[src="' + tempFlag + '"]').attr('src', realFlag);
            // replace temporary flag where its used as a background to fork event in journal
            $('a[target="' + site + '"]').attr('style', 'background-image: url(' + realFlag + ')');
            return tempFlags[site] = null;
          }
        });


        // create a temp flag, save it for reuse, and return it
        const tempFlag = createTempFlag(site);
        tempFlags[site] = tempFlag;
        return tempFlag;
      }
    },

    getURL(route) {
      if (sitePrefix[site] != null) {
        if (sitePrefix[site] === "") {
          console.log(`${site} is unreachable, can't link to ${route}`);
          return "";
        } else {
          return `${sitePrefix[site]}/${route}`;
        }
      } else {
        // don't yet know how to construct links for site, so find how and fixup
        //findAdapterQ.push {site: site}, (prefix) ->
        findAdapter(site, function(prefix) {
          if (prefix === "") {
            return console.log(`${site} is unreachable`);
          } else {
            console.log(`Prefix for ${site} is ${prefix}, about to fixup links`);
            // add href to journal fork
            return $('a[target="' + site + '"]').each( function() {
              let thisPrefix;
              if (/proxy/.test(prefix)) {
                const thisSite = prefix.substring(7);
                thisPrefix = `http://${thisSite}`;
              } else {
                thisPrefix = prefix;
              }
              return $(this).attr('href', `${thisPrefix}/${$(this).data("slug")}.html`); });
          }
        });
        return "";
      }
    },

    getDirectURL(route) {
      let thisPrefix, thisSite;
      if (sitePrefix[site] != null) {
        if (sitePrefix[site] === "") {
          console.log(`${site} is unreachable, can't link to ${route}`);
          return "";
        } else {
          if (/proxy/.test(sitePrefix[site])) {
            thisSite = sitePrefix[site].substring(7);
            thisPrefix = `http://${thisSite}`;
          } else {
            thisPrefix = sitePrefix[site];
          }
          return `${thisPrefix}/${route}`;
        }
      } else {
        findAdapter(site, function(prefix) {
          if (prefix === "") {
            return console.log(`${site} is unreachable`);
          } else {
            console.log(`Prefix for ${site} is ${prefix}, about to fixup links`);
            // add href to journal fork
            return $('a[target="' + site + '"]').each( function() {
              if (/proxy/.test(prefix)) {
                thisSite = prefix.substring(7);
                thisPrefix = `http://${thisSite}`;
              } else {
                thisPrefix = prefix;
              }
              return $(this).attr('href', `${thisPrefix}/${$(this).data("slug")}.html`); });
          }
        });
        return "";
      }
    },

    get(route, callback) {
      let errMsg;
      const done = function(err, value) { if (callback) { return callback(err, value); } };

      var getContent = function(route, done) {
        const url = `${sitePrefix[site]}/${route}`;
        const useCredentials = credentialsNeeded[site] || false;

        return $.ajax({
          type: 'GET',
          dataType: 'json',
          url,
          xhrFields: { withCredentials: useCredentials },
          success(data, code, xhr) {
            if ((((route === 'system/sitemap.json') && Array.isArray(data) && (data[0] === 'Login Required')) || (data.title === 'Login Required')) && !url.includes('login-required') && (credentialsNeeded[site] !== true)) {
              credentialsNeeded[site] = true;
              return getContent(route, function(err, page) {
                if (!err) {
                  withCredsStore.setItem(site, true);
                  return done(err, page);
                } else {
                  credentialsNeeded[site] = false;
                  return done(err, page);
                }
              });
            } else {
              if (route === 'system/sitemap.json') {
                done(null, { data, lastModified: Date.parse(xhr.getResponseHeader('Last-Modified')) });
              } else {
                done(null, data);
              }
              if (!callback) { return Promise.resolve(data); }
            }
          },
          error(xhr, type, msg) {
            done({msg, xhr}, null);
            if (!callback) { return Promise.reject(msg); }
          }
        });
      };

      if (sitePrefix[site] != null) {
        if (sitePrefix[site] === "") {
          console.log(`${site} is unreachable`);
          errMsg = {msg: `${site} is unreachable`, xhr: {status: 0}};
          done(errMsg, null);
          if (!callback) { return Promise.reject(errMsg); }
        } else {
          return getContent(route, done);
        }
      } else {
        //findAdapterQ.push {site: site}, (prefix) ->
        return findAdapter(site, function(prefix) {
          if (prefix === "") {
            console.log(`${site} is unreachable`);
            errMsg = {msg: `${site} is unreachable`, xhr: {status: 0}};
            done(errMsg, null);
            if (!callback) { return Promise.reject(errMsg); }
          } else {
            return getContent(route, done);
          }
        });
      }
    },

    getIndex(route, callback) {
      // used for getting the serialized JSON file used by minisearch, needs to be a text string rather than an object.
      // This only differs from `get` by using dataType of text, rather than json.
      let errMsg;
      const done = function(err, value) { if (callback) { return callback(err, value); } };

      var getContent = function(route, done) {
        const url = `${sitePrefix[site]}/${route}`;
        const useCredentials = credentialsNeeded[site] || false;

        return $.ajax({
          type: 'GET',
          dataType: 'text',
          url,
          xhrFields: { withCredentials: useCredentials },
          success(data) {
            if ((data.title === 'Login Required') && !url.includes('login-required') && (credentialsNeeded[site] !== true)) {
              credentialsNeeded[site] = true;
              return getContent(route, function(err, page) {
                if (!err) {
                  withCredsStore.setItem(site, true);
                  return done(err, page);
                } else {
                  credentialsNeeded[site] = false;
                  return done(err, page);
                }
              });
            } else {
              done(null, data);
              if (!callback) { return Promise.resolve(data); }
            }
          },
          error(xhr, type, msg) {
            done({msg, xhr}, null);
            if (!callback) { return Promise.reject(msg); }
          }
        });
      };

      if (sitePrefix[site] != null) {
        if (sitePrefix[site] === "") {
          console.log(`${site} is unreachable`);
          errMsg = {msg: `${site} is unreachable`, xhr: {status: 0}};
          done(errMsg, null);
          if (!callback) { return Promise.reject(errMsg); }
        } else {
          return getContent(route, done);
        }
      } else {
        //findAdapterQ.push {site: site}, (prefix) ->
        return findAdapter(site, function(prefix) {
          if (prefix === "") {
            console.log(`${site} is unreachable`);
            errMsg = {msg: `${site} is unreachable`, xhr: {status: 0}};
            done(errMsg, null);
            if (!callback) { return Promise.reject(errMsg); }
          } else {
            return getContent(route, done);
          }
        });
      }
    },

    refresh(done) {
      // Refresh is used to redetermine the sitePrefix prefix, and update the
      // stored value.

      let realFlag, tempFlag;
      console.log(`Refreshing ${site}`);

      if ((tempFlags[site] == null)) {
        // refreshing route for a site that we know the route for...
        // currently performed when clicking on a neighbor that we
        // can't retrieve a sitemap for.

        // replace flag with temp flags
        tempFlag = createTempFlag(site);
        tempFlags[site] = tempFlag;
        realFlag = sitePrefix[site] + "/favicon.png";
        // replace flag with temporary flag where it is used as an image
        $('img[src="' + realFlag + '"]').attr('src', tempFlag);
        // replace temporary flag where its used as a background to fork event in journal
        $('a[target="' + site + '"]').attr('style', 'background-image: url(' + tempFlag + ')');
      }

      sitePrefix[site] = null;
      return routeStore.removeItem(site).then(() => findAdapterQ.push({site}, prefix => routeStore.setItem(site, prefix).then(function(value) {
        if (prefix === "") {
          console.log(`Refreshed prefix for ${site} is undetermined...`);
        } else {
          console.log(`Refreshed prefix for ${site} is ${prefix}`);
          // replace temp flags
          tempFlag = tempFlags[site];
          realFlag = sitePrefix[site] + "/favicon.png";
          // replace temporary flag where it is used as an image
          $('img[src="' + tempFlag + '"]').attr('src', realFlag);
          // replace temporary flag where its used as a background to fork event in journal
          $('a[target="' + site + '"]').attr('style', 'background-image: url(' + realFlag + ')');
        }
        return done();}).catch(function(err) {
        console.log("findAdapter setItem error: ", site, err);
        sitePrefix[site] = "";
        return done();
      }))).catch(function(err) {
        console.log('refresh error ', site, err);
        return done();
      });
    }
        // same as if delete worked?


  };
};
