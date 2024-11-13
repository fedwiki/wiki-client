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
    const id = setTimeout( function() {
      clearTimeout(id);
      reject();
    }
    , fetchTimeoutMS);
  });

  const fetchURL = new Promise( (resolve, reject) => $.ajax({
    type: 'GET',
    url,
    success() { resolve(); },
    error() { reject(); }}));

  testRace = Promise.race([
    fetchTimeout,
    fetchURL
    ])
  .then(() => good())
  .catch(() => bad());
};




const findAdapterQ = queue( function(task, done) {
  let testURL;
  const { site } = task;
  if (sitePrefix[site]) {
    done(sitePrefix[site]);
  }

  if (site.split('.').at(-1).split(':')[0] === 'localhost') {
    testURL = `http://${site}/favicon.png`;
  } else {
    testURL = `//${site}/favicon.png`;
  }
  return testWikiSite(testURL, (function() {
    sitePrefix[site] = testURL.slice(0,-12);
    done(testURL.slice(0,-12));
  }), function() {
    switch (location.protocol) {
      case 'http:':
        testURL = `https://${site}/favicon.png`;
        testWikiSite(testURL, (function () {
          sitePrefix[site] = `https://${site}`;
          done(`https://${site}`);
        }), function () {
          sitePrefix[site] = "";
          done("");
        });
        break;
      case 'https:':
        testURL = `/proxy/${site}/favicon.png`;
        return testWikiSite(testURL, (function () {
          sitePrefix[site] = `/proxy/${site}`;
          done(`/proxy/${site}`);
        }), function () {
          sitePrefix[site] = "";
          done("");
        });
        break;
      default:
        sitePrefix[site] = "";
        done("");
    }
  });
}
, findQueueWorkers); // start with 8 process working on the queue

const findAdapter = (site, done) => routeStore.getItem(site).then(function(value) {
  // console.log "findAdapter: ", site, value
  if (!value) {
    findAdapterQ.push({site}, function(prefix) {
      sitePrefix[site] = prefix;
      routeStore.setItem(site, prefix).then(value => done(prefix)).catch(function(err) {
        console.log("findAdapter setItem error: ", site, err);
        done(prefix);
      });
    });
  } else {
    sitePrefix[site] = value;
    done(value);
  }}).catch(function(err) {
  console.log("findAdapter error: ", site, err);
  sitePrefix[site] = "";
  done("");
});

siteAdapter.local = {
  flag() { return "/favicon.png"; },
  getURL(route) { return `/${route}`; },
  getDirectURL(route) { return `/${route}`; },
  get(route, callback) {
    let page;
    const done = function(err, value) { if (callback) { callback(err, value); } };

    // console.log "wiki.local.get #{route}"
    if (page = localStorage.getItem(route.replace(/\.json$/,''))) {
      const parsedPage = JSON.parse(page);
      done(null, parsedPage);
      if (!callback) { Promise.resolve(parsedPage); }
    } else {
      const errMsg = {msg: `no page named '${route}' in browser local storage`};
      done(errMsg, null);
      // console.log("tried to local fetch a page that isn't local")
      if (!callback) { Promise.reject(errMsg); }
    }
  },
  put(route, data, done) {
    // console.log "wiki.local.put #{route}"
    localStorage.setItem(route, JSON.stringify(data));
    done();
  },
  delete(route) {
    // console.log "wiki.local.delete #{route}"
    localStorage.removeItem(route);
  }
};

siteAdapter.origin = {
  flag() { return "/favicon.png"; },
  getURL(route) { return `/${route}`; },
  getDirectURL(route) { return `/${route}`; },
  get(route, callback) {
    const done = function(err, value) { if (callback) { callback(err, value); } };
    // console.log "wiki.origin.get #{route}"
    $.ajax({
      type: 'GET',
      dataType: 'json',
      url: `/${route}`,
      success(page, code, xhr) {
        if (route === 'system/sitemap.json') {
          done(null, { data: page, lastModified: Date.parse(xhr.getResponseHeader('Last-Modified') )});
        } else {
          done(null, page);
        }
      },
      error(xhr, type, msg) { done({msg, xhr}, null); }
    });
  },
  getIndex(route, callback) {
    const done = function(err, value) { if (callback) { callback(err, value); } };
    // console.log "wiki.origin.get #{route}"
    $.ajax({
      type: 'GET',
      dataType: 'text',
      url: `/${route}`,
      success(page) { done(null, page); },
      error(xhr, type, msg) { done({msg, xhr}, null); }
    });
  },
  put(route, data, done) {
    // console.log "wiki.orgin.put #{route}"
    $.ajax({
      type: 'PUT',
      url: `/page/${route}/action`,
      data: {
        'action': JSON.stringify(data)
      },
      success() { done(null); },
      error(xhr, type, msg) { done({xhr, type, msg}); }});
  },
  delete(route, done) {
    // console.log "wiki.origin.delete #{route}"
    $.ajax({
      type: 'DELETE',
      url: `/${route}`,
      success() { done(null); },
      error(xhr, type, msg) { done({xhr, type, msg}); }});
  }
};

siteAdapter.recycler = {
  flag() { return "/recycler/favicon.png"; },
  getURL(route) { return `/recycler/${route}`; },
  getDirectURL(route) { return `/recycler/${route}`; },
  get(route, callback) {
    const done = function(err, value) { if (callback) { callback(err, value); } };
    // console.log "wiki.recycler.get #{route}"
    $.ajax({
      type: 'GET',
      dataType: 'json',
      url: `/recycler/${route}`,
      success(page) { done(null, page); },
      error(xhr, type, msg) { done({msg, xhr}, null); }
    });
  },
  delete(route, done) {
    // console.log "wiki.recycler.delete #{route}"
    $.ajax({
      type: 'DELETE',
      url: `/recycler/${route}`,
      success() { done(null); },
      error(xhr, type, msg) { done({xhr, type, msg}); }});
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
          if (tempFlags[site]) {
            return tempFlags[site];
          } else {
            return tempFlags[site] = createTempFlag(site);
          }
        } else {
          // we already know how to construct flag url
          return sitePrefix[site] + "/favicon.png";
        }
      } else if (tempFlags[site]) {
        // we already have a temp. flag
        return tempFlags[site];
      } else {
        // we don't know the url to the real flag, or have a temp flag

//        findAdapterQ.push {site: site}, (prefix) ->
        findAdapter(site, function(prefix) {
          if (prefix === "") {
            console.log(`Prefix for ${site} is undetermined...`);
          } else {
            console.log(`Prefix for ${site} is ${prefix}`);
            // replace temp flags
            const tempFlag = tempFlags[site];
            const realFlag = sitePrefix[site] + "/favicon.png";
            // replace temporary flag where it is used as an image
            $('img[src="' + tempFlag + '"]').attr('src', realFlag);
            // replace temporary flag where its used as a background to fork event in journal
            $('a[target="' + site + '"]').attr('style', 'background-image: url(' + realFlag + ')');
            tempFlags[site] = null;
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
            console.log(`${site} is unreachable`);
          } else {
            console.log(`Prefix for ${site} is ${prefix}, about to fixup links`);
            // add href to journal fork
            $('a[target="' + site + '"]').each( function() {
              let thisPrefix;
              if (/proxy/.test(prefix)) {
                const thisSite = prefix.substring(7);
                thisPrefix = `http://${thisSite}`;
              } else {
                thisPrefix = prefix;
              }
              $(this).attr('href', `${thisPrefix}/${$(this).data("slug")}.html`); });
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
            console.log(`${site} is unreachable`);
          } else {
            console.log(`Prefix for ${site} is ${prefix}, about to fixup links`);
            // add href to journal fork
            $('a[target="' + site + '"]').each( function() {
              if (/proxy/.test(prefix)) {
                thisSite = prefix.substring(7);
                thisPrefix = `http://${thisSite}`;
              } else {
                thisPrefix = prefix;
              }
              $(this).attr('href', `${thisPrefix}/${$(this).data("slug")}.html`); });
          }
        });
        return "";
      }
    },

    get(route, callback) {
      let errMsg;
      const done = function(err, value) { if (callback) { callback(err, value); } };

      var getContent = function(route, done) {
        const url = `${sitePrefix[site]}/${route}`;
        const useCredentials = credentialsNeeded[site] || false;

        $.ajax({
          type: 'GET',
          dataType: 'json',
          url,
          xhrFields: { withCredentials: useCredentials },
          success(data, code, xhr) {
            if ((((route === 'system/sitemap.json') && Array.isArray(data) && (data[0] === 'Login Required')) || (data.title === 'Login Required')) && !url.includes('login-required') && (credentialsNeeded[site] !== true)) {
              credentialsNeeded[site] = true;
              getContent(route, function(err, page) {
                if (!err) {
                  withCredsStore.setItem(site, true);
                  done(err, page);
                } else {
                  credentialsNeeded[site] = false;
                  done(err, page);
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
        findAdapter(site, function(prefix) {
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
      const done = function(err, value) { if (callback) { callback(err, value); } };

      var getContent = function(route, done) {
        const url = `${sitePrefix[site]}/${route}`;
        const useCredentials = credentialsNeeded[site] || false;

        $.ajax({
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
                  done(err, page);
                } else {
                  credentialsNeeded[site] = false;
                  done(err, page);
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
        findAdapter(site, function(prefix) {
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
      console.log(`Refreshing ${site}`);

      if (tempFlags[site] == null) {
        // refreshing route for a site that we know the route for...
        // currently performed when clicking on a neighbor that we
        // can't retrieve a sitemap for.

        // replace flag with temp flags
        const tempFlag = createTempFlag(site);
        tempFlags[site] = tempFlag;
        const realFlag = sitePrefix[site] + "/favicon.png";
        // replace flag with temporary flag where it is used as an image
        $('img[src="' + realFlag + '"]').attr('src', tempFlag);
        // replace temporary flag where its used as a background to fork event in journal
        $('a[target="' + site + '"]').attr('style', 'background-image: url(' + tempFlag + ')');
      }

      // reset site prefix
      sitePrefix[site] = null;

      // update storage
      routeStore.removeItem(site)
        .then(() => {
          findAdapterQ.push({site}, prefix => {
            routeStore.setItem(site, prefix)
              .then(() => {
                if (prefix === "") {
                  console.log(`Refreshed prefix for ${site} is undetermined...`);
                } else {
                  console.log(`Refreshed prefix for ${site} is ${prefix}`);
                  // replace temp flags
                  const tempFlag = tempFlags[site];
                  const realFlag = sitePrefix[site] + "/favicon.png";
                  // replace temporary flag where it is used as an image
                  $('img[src="' + tempFlag + '"]').attr('src', realFlag);
                  // replace temporary flag where its used as a background to fork event in journal
                  $('a[target="' + site + '"]').attr('style', 'background-image: url(' + realFlag + ')');
                }
                done();
              })
              .catch(err => {
                console.log("findAdapter setItem error: ", site, err);
                sitePrefix[site] = "";
                done();
              });
          });
        })
        .catch(err => {
          console.log('refresh error ', site, err);
          done();
        });
    }
        // same as if delete worked?
  };
};
