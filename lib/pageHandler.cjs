// The pageHandler bundles fetching and storing json pages
// from origin, remote and browser local storage. It handles
// incremental updates and implicit forks when pages are edited.

let pageHandler;

const state = require('./state.cjs');
const revision = require('./revision.cjs');
const addToJournal = require('./addToJournal.cjs');
const {
  newPage
} = require('./page.cjs');
const random = require('./random.cjs');
const lineup = require('./lineup.cjs');
const neighborhood = require('./neighborhood.cjs');

module.exports = (pageHandler = {});

const deepCopy = object => JSON.parse(JSON.stringify(object));

pageHandler.useLocalStorage = () => $(".login").length > 0;

const pageFromLocalStorage = function(slug){
  let json;
  if ((json = localStorage.getItem(slug))) {
    return JSON.parse(json);
  } else {
    return undefined;
  }
};

var recursiveGet = function({pageInformation, whenGotten, whenNotGotten, localContext}) {
  let {slug,rev,site} = pageInformation;

  const localBeforeOrigin = {
    get(slug, done) {
      wiki.local.get(slug, function(err, page) {
        // console.log [err, page]
        if (err) {
          wiki.origin.get(slug, done);
        } else {
          site = 'local';
          done(null, page);
        }
      });
    }
  };

  if (site) {
    localContext = [];
  } else {
    site = localContext.shift();
  }

  if (site === window.location.host) { site = 'origin'; }
  if (site === null) { site = 'view'; }

  // suggest by Claude Sonnet as an alternative to using switch.
  const adapter = {
    'local': wiki.local,
    'origin': wiki.origin,
    'recycler': wiki.recycler,
    'view': localBeforeOrigin
  }[site] ?? wiki.site(site);

  adapter.get(`${slug}.json`, function(err, page) {
    if (!err) {
      // console.log 'got', site, page
      if (rev) { page = revision.create(rev, page); }
      whenGotten(newPage(page, site));
    } else {
      if (([403, 404].includes(err.xhr.status) ) || (err.xhr.status === 0)) {
        if (localContext.length > 0) {
          recursiveGet( {pageInformation, whenGotten, whenNotGotten, localContext} );
        } else {
          whenNotGotten();
        }
      } else {
        const url = adapter.getDirectURL(pageInformation.slug);
        const text = `\
The page handler has run into problems with this request.
<pre class=error>${JSON.stringify(pageInformation)}</pre>
The requested url.
<pre class=error>${url}</pre>
The server reported status.
<pre class=error>${err.xhr?.status}</pre>
The error message.
<pre class=error>${err.msg}</pre>
These problems are rarely solved by reporting issues.
There could be additional information reported in the browser's console.log.
More information might be accessible by fetching the page outside of wiki.
<a href="${url}" target="_blank">try-now</a>\
`;
        const trouble = newPage({title: "Trouble: Can't Get Page"}, null);
        trouble.addItem({type:'html', text});
        whenGotten(trouble);
      }
    }
  });
};


pageHandler.get = function({whenGotten,whenNotGotten,pageInformation}  ) {

  if (!pageInformation.site) {
    let localPage;
    if (localPage = pageFromLocalStorage(pageInformation.slug)) {
      if (pageInformation.rev) { localPage = revision.create(pageInformation.rev, localPage); }
      whenGotten(newPage( localPage, 'local' ));
      return;
    }
  }

  if (!pageHandler.context.length) { pageHandler.context = ['view']; }

  recursiveGet({
    pageInformation,
    whenGotten,
    whenNotGotten,
    localContext: pageHandler.context.slice()
  });
};


pageHandler.context = [];

const pushToLocal = function($page, pagePutInfo, action) {
  let page;
  if (action.type === 'create') {
    page = {title: action.item.title, story:[], journal:[]};
  } else {
    let site;
    page = pageFromLocalStorage(pagePutInfo.slug);
    if (!page) { page = lineup.atKey($page.data('key')).getRawPage(); }
    page.journal ||= [];
    if (site=action['fork']) {
      page.journal = page.journal.concat({'type':'fork','site':site,'date':(new Date()).getTime()});
      delete action['fork'];
    }
  }
  revision.apply(page, action);
  wiki.local.put(pagePutInfo.slug, page, function() {
    addToJournal($page.find('.journal'), action);
    $page.addClass("local");
  });
};

const pushToServer = function($page, pagePutInfo, action) {

  // bundle rawPage which server will strip out
  const bundle = deepCopy(action);
  const pageObject = lineup.atKey($page.data('key'));
  if (action.fork || (action.type === 'fork')) {
    bundle.forkPage = deepCopy(pageObject.getRawPage());
  }

  wiki.origin.put(pagePutInfo.slug, bundle, function(err) {
    if (err) {
      action.error = { type: err.type, msg: err.msg, response: err.xhr.responseText};
      pushToLocal($page, pagePutInfo, action);
    } else {
      if (pageObject?.apply) { pageObject.apply(action); }
      neighborhood.updateSitemap(pageObject);
      neighborhood.updateIndex(pageObject);
      addToJournal($page.find('.journal'), action);
      if (action.type === 'fork') {
        wiki.local.delete($page.attr('id'));
      }
      if ((action.type !== 'fork') && action.fork) {
        // implicit fork, probably only affects image plugin
        if (action.item.type === 'image') {
          const index = $page.find('.item').index($page.find('#' + action.item.id).context);
          wiki.renderFrom(index);
        }
      }
    }
  });
};


pageHandler.put = function($page, action) {

  const checkedSite = function() {
    let site;
    switch ((site = $page.data('site'))) {
      case 'origin': case 'local': case 'view': return null;
      case location.host: return null;
      default: return site;
    }
  };

  // about the page we have
  const pagePutInfo = {
    slug: $page.attr('id').split('_rev')[0],
    rev: $page.attr('id').split('_rev')[1],
    site: checkedSite(),
    local: $page.hasClass('local')
  };
  let forkFrom = pagePutInfo.site;
  // console.log 'pageHandler.put', action, pagePutInfo

  // detect when fork to local storage
  if (pageHandler.useLocalStorage()) {
    if (pagePutInfo.site) {
      // console.log 'remote => local'
    } else if (!pagePutInfo.local) {
      // console.log 'origin => local'
      action.site = (forkFrom = location.host);
    }
  }
    // else if !pageFromLocalStorage(pagePutInfo.slug)
    //   console.log ''
    //   action.site = forkFrom = pagePutInfo.site
    //   console.log 'local storage first time', action, 'forkFrom', forkFrom

  // tweek action before saving
  action.date = (new Date()).getTime();
  if (action.site === 'origin') { delete action.site; }

  // update dom when forking
  $page.removeClass('plugin');
  if (forkFrom) {
    // pull remote site closer to us
    $page.find('h1').prop('title',location.host);
    $page.find('h1 img').attr('src', '/favicon.png');
    $page.find('h1 a').attr('href', `/view/welcome-visitors/view/${pagePutInfo.slug}`).attr('target',location.host);
    $page.data('site', null);
    $page.removeClass('remote');
    //STATE -- update url when site changes
    state.setUrl();
    if (action.type !== 'fork') {
      // bundle implicit fork with next action
      action.fork = forkFrom;
      addToJournal($page.find('.journal'), {
        type: 'fork',
        site: forkFrom,
        date: action.date
      }
      );
    }
  }

  // store as appropriate
  if (pageHandler.useLocalStorage() || (pagePutInfo.site === 'local')) {
    pushToLocal($page, pagePutInfo, action);
  } else {
    pushToServer($page, pagePutInfo, action);
  }
};

pageHandler.delete = function(pageObject, $page, done) {
  // console.log 'delete server-side'
  // console.log 'pageObject:', pageObject
  if (pageObject.isRecycler()) {
    wiki.recycler.delete(`${pageObject.getSlug()}.json`, function(err) {
      const more = () => done(err);
      setTimeout(more, 300);
    });
  } else {
    wiki.origin.delete(`${pageObject.getSlug()}.json`, function(err) {
      const more = function() {
        if (!err) {
          neighborhood.deleteFromSitemap(pageObject);
          neighborhood.deleteFromIndex(pageObject);
        }
        done(err);
      };
      setTimeout(more, 300);
    }); // simulate server turnaround
  }
};
