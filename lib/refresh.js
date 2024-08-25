// Refresh will fetch a page and use it to fill a dom
// element that has been ready made to hold it.
//
// cycle: have a div, $(this), with id = slug
// whenGotten: have a pageObject we just fetched
// buildPage: have a pageObject from somewhere
// rebuildPage: have a key from saving pageObject in lineup
// renderPageIntoPageElement: have $page annotated from pageObject
// pageObject.seqItems: get back each item sequentially
// plugin.do: have $item in dom for item
//
// The various calling conventions are due to async
// requirements and the work of many hands.

const pageHandler = require('./pageHandler');
const plugin = require('./plugin');
const state = require('./state');
const neighborhood = require('./neighborhood');
const addToJournal = require('./addToJournal');
const actionSymbols = require('./actionSymbols');
const lineup = require('./lineup');
const resolve = require('./resolve');
const random = require('./random');
const wiki = require('./wiki');

const pageModule = require('./page');
const {
  newPage
} = pageModule;
const {
  asSlug
} = pageModule;
const {
  pageEmitter
} = pageModule;


const getItem = function($item) {
  if ($($item).length > 0) { return $($item).data("item") || $($item).data('staticItem'); }
};

const aliasItem = function($page, $item, oldItem) {
  const item = $.extend({}, oldItem);
  $item.data('item', item);
  const pageObject = lineup.atKey($page.data('key'));
  if (pageObject.getItem(item.id) != null) {
    if (!item.alias) { item.alias = item.id; }
    item.id = random.itemId();
    $item.attr('data-id', item.id);
    $item.data('id', item.id);
    $item.data('item').id = item.id;
  } else if (item.alias != null) {
    if (pageObject.getItem(item.alias) == null) {
      item.id = item.alias;
      delete item.alias;
      $item.attr('data-id', item.id);
    }
  }
  return item;
};

const equals = (a, b) => a && b && (a.get(0) === b.get(0));
const getStoryItemOrder = $story => $story.children().map((_, value) => $(value).attr('data-id')).get();

const handleDrop = function(evt, ui, originalIndex, originalOrder) {
  let dragAttribution, index;
  const $item = ui.item;

  let item = getItem($item);
  const $sourcePage = $item.data('pageElement');
  const sourceIsReadOnly = $sourcePage.hasClass('ghost') || $sourcePage.hasClass('remote');

  if (!$sourcePage.hasClass('ghost')) {
    dragAttribution = {
      page: $sourcePage.data().data['title']
    };
    if ($sourcePage.data().site != null) {
      dragAttribution['site'] = $sourcePage.data().site;
    }
  }

  const $destinationPage = $item.parents('.page:first');
  const destinationIsGhost = $destinationPage.hasClass('ghost');

  const moveWithinPage = equals($sourcePage, $destinationPage);
  const moveBetweenDuplicatePages = !moveWithinPage && 
    !evt.shiftKey && 
    ($sourcePage.attr('id') === $destinationPage.attr('id'));

  const removedTo = {
    page: $destinationPage.data().data['title']
  };

  if (destinationIsGhost || moveBetweenDuplicatePages) {
    $(evt.target).sortable('cancel');
    return;
  }

  if (moveWithinPage) {
    const order = getStoryItemOrder($item.parents('.story:first'));
    if (JSON.stringify(order) !==  JSON.stringify(originalOrder)) {
      $('.shadow-copy').remove();
      $item.empty();
      index = $(".item").index($item);
      if (originalIndex < index) { index = originalIndex; }
      plugin.renderFrom(index);
      pageHandler.put($destinationPage, {id: item.id, type: 'move', order});
    }
    return;
  }
  const copying = sourceIsReadOnly || evt.shiftKey;
  if (copying) {
    // If making a copy, update the temp clone so it becomes a true copy.
    $('.shadow-copy').removeClass('shadow-copy')
      .data($item.data()).attr({'data-id': $item.attr('data-id')});
  } else {
    pageHandler.put($sourcePage, {id: item.id, type: 'remove', removedTo});
  }
  // Either way, record the add to the new page
  $item.data('pageElement', $destinationPage);
  const $before = $item.prev('.item');
  const before = getItem($before);
  item = aliasItem($destinationPage, $item, item);
  pageHandler.put($destinationPage,
                  {id: item.id, type: 'add', item, after: before?.id, attribution: dragAttribution });
  $('.shadow-copy').remove();
  $item.empty();
  $before.after($item);
  index = $(".item").index($item);
  if (originalIndex < index) { index = originalIndex; }
  plugin.renderFrom(index);
};

const changeMouseCursor = function(e, ui) {
  const $sourcePage = ui.item.data('pageElement');
  const sourceIsReadOnly = $sourcePage.hasClass('ghost') || $sourcePage.hasClass('remote');
  const $destinationPage = ui.placeholder.parents('.page:first');
  const destinationIsGhost = $destinationPage.hasClass('ghost');
  const moveWithinPage = equals($sourcePage, $destinationPage);
  const moveBetweenDuplicatePages = !moveWithinPage && 
    ($sourcePage.attr('id') === $destinationPage.attr('id'));
  const copying = sourceIsReadOnly || (e.shiftKey && !moveWithinPage);
  if (destinationIsGhost || (moveBetweenDuplicatePages && !e.shiftKey)) {
    $('body').css('cursor', 'no-drop');
    return $('.shadow-copy').hide();
  } else if (copying) {
    $('body').css('cursor', 'copy');
    return $('.shadow-copy').show();
  } else {
    $('body').css('cursor', 'move');
    return $('.shadow-copy').hide();
  }
};

const initDragging = function($page) {
  const origCursor = $('body').css('cursor');
  const options = {
    connectWith: '.page .story',
    placeholder: 'item-placeholder',
    forcePlaceholderSize: true,
    delay: 150
  };
  const $story = $page.find('.story');
  let originalOrder = null;
  let originalIndex = null;
  let dragCancelled = null;
  const cancelDrag = function(e) {
    if (e.which === 27) {
      dragCancelled = true;
      return $story.sortable('cancel');
    }
  };
  return $story.sortable(options)
    .on('sortstart', function(e, ui) {
      const $item = ui.item;
      originalOrder = getStoryItemOrder($story);
      originalIndex = $('.item').index($item);
      dragCancelled = false;
      $('body').on('keydown', cancelDrag);
      // Create a copy that we control since sortable removes theirs too early.
      // Insert after the placeholder to prevent adding history when item not moved.
      // Clear out the styling they add. Updates to jquery ui can affect this.
      return $item.clone().insertAfter(ui.placeholder).hide().addClass("shadow-copy")
        .css({
          width: '',
          height: '',
          position: '',
          zIndex: ''
        }).removeAttr('data-id');
  }).on('sort', changeMouseCursor)
    .on('sortstop', function(e, ui) {
      $('body').css('cursor', origCursor).off('keydown', cancelDrag);
      if (!dragCancelled) { handleDrop(e, ui, originalIndex, originalOrder); }
      return $('.shadow-copy').remove();
  });
};

const getPageObject = function($journal) {
  const $page = $($journal).parents('.page:first');
  return lineup.atKey($page.data('key'));
};

const handleMerging = function(event, ui) {
  const drag = getPageObject(ui.draggable);
  const drop = getPageObject(event.target);
  pageEmitter.emit('show', drop.merge(drag));
};

const initMerging = function($page) {
  const $journal = $page.find('.journal');
  $journal.draggable({
    revert: true,
    appendTo: '.main',
    scroll: false,
    helper: 'clone'
  });
  $journal.droppable({
    hoverClass: "ui-state-hover",
    drop: handleMerging,
    accept: '.journal'
  });
};

const initAddButton = $page => $page.find(".add-factory").on("click", function(evt) {
  if ($page.hasClass('ghost')) { return; }
  evt.preventDefault();
  createFactory($page);
});

var createFactory = function($page) {
  const item = {
    type: "factory",
    id: random.itemId()
  };
  const $item = $("<div />", {class: "item factory"}).data('item',item).attr('data-id', item.id);
  $item.data('pageElement', $page);
  $page.find(".story").append($item);
  plugin.do($item, item);
  const $before = $item.prev('.item');
  const before = getItem($before);
  pageHandler.put($page, {item, id: item.id, type: "add", after: before?.id});
};

const handleHeaderClick = function(e) {
    e.preventDefault();
    lineup.debugSelfCheck((Array.from($('.page')).map((each) => $(each).data('key'))));
    const $page = $(e.target).parents('.page:first');
    const crumbs = lineup.crumbs($page.data('key'), location.host);
    const target = crumbs[0];
    let prefix= wiki.site(target).getDirectURL('').split('/')[0];
    if (prefix === '') {
      prefix = window.location.protocol;
    }
    const newWindow = window.open(`${prefix}//${crumbs.join('/')}`, target);
    newWindow.focus();
  };


const emitHeader = function($header, $page, pageObject) {
  let remote;
  if (pageObject.isRecycler()) {
    remote = 'recycler';
  } else {
    remote = pageObject.getRemoteSite(location.host);
  }
  const tooltip = pageObject.getRemoteSiteDetails(location.host);
  $header.append(`\
<h1 title="${tooltip}">
  <span>
    <a href="${pageObject.siteLineup()}" target="${remote}">
      <img src="${wiki.site(remote).flag()}" height="32px" class="favicon"></a>
    ${resolve.escape(pageObject.getTitle())}
  </span>
</h1>\
`
  );
  $header.find('a').on('click', handleHeaderClick);
};

const emitTimestamp = function($header, $page, pageObject) {
  if ($page.attr('id').match(/_rev/)) {
    $page.addClass('ghost');
    $page.data('rev', pageObject.getRevision());
    $header.append($(`\
<h2 class="revision">
  <span>
    ${pageObject.getTimestamp()}
  </span>
</h2>\
`
    )
    );
  }
};

const emitControls = $journal => $journal.append(`\
<div class="control-buttons">
<a href="#" class="button fork-page" title="fork this page">${actionSymbols.fork}</a>
<a href="#" class="button add-factory" title="add paragraph">${actionSymbols.add}</a>
</div>\
`
);

const emitBacklinks = function($backlinks, pageObject) {
  const slug = pageObject.getSlug();
  const backlinks = neighborhood.backLinks(slug);
  if (Object.keys(backlinks).length > 0) {
    const links = [];
    
    for (var linkSlug in backlinks) {
      var backlink = backlinks[linkSlug];
      backlink.sites.sort((a, b) => (a.date || 0) < (b.date || 0));
      var flags = [];
      for (var i = 0; i < backlink.sites.length; i++) {
        var site = backlink.sites[i];
        if (i < 10) {
          var joint = backlink.sites[i-1]?.date === site.date ? "" : " ";
          flags.unshift(joint);
          flags.unshift(`\
<img class="remote"
    src="${wiki.site(site.site).flag()}"
    data-slug="${linkSlug}"
    data-site="${site.site}"
    data-id="${site.itemId}"
    title="${site.site}\n${wiki.util.formatElapsedTime(site.date)}">\
`
          );
        } else if (i === 10) {
          flags.unshift(' ⋯ ');
        }
      }
      
      var linkBack = resolve.resolveLinks(`[[${backlink.title}]]`);
      links.push(`\
<div style="clear: both;">
  <div style="float: left;">${linkBack}</div>
  <div style="text-align: right;"> ${flags.join('')} </div>
</div>\
`
      );
    }

    if (links) {
      $backlinks.append(`\
<details>
  <summary>${links.length} pages link here:</summary>
  ${links.join("\n")}
</details>\
`
      );
    }
  }
};

const emitFooter = function($footer, pageObject) {
  const host = pageObject.getRemoteSite(location.host);
  const slug = pageObject.getSlug();
  $footer.append(`\
<a class="show-page-license" href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank">CC BY-SA 4.0</a> .
<a class="show-page-source" href="${wiki.site(host).getDirectURL(slug)}.json" title="source">JSON</a> .
<a href= "${wiki.site(host).getDirectURL(slug)}.html" date-slug="${slug}" target="${host}">${host} </a> .
<a href= "#" class=search>search</a>\
`
  );
};

const editDate = function(journal) {
  const iterable = journal || [];
  for (let i = iterable.length - 1; i >= 0; i--) {
    var action = iterable[i];
    if (action.date && (action.type !== 'fork')) { return action.date; }
  }
  return undefined;
};

const emitTwins = function($page) {
  let viewing;
  let remoteSite, item;
  const page = $page.data('data');
  if (!page) { return; }
  let site = $page.data('site') || window.location.host;
  if (['view', 'origin'].includes(site)) { site = window.location.host; }
  const slug = asSlug(page.title);
  if (viewing = editDate(page.journal)) {
    let bin;
    const bins = {newer:[], same:[], older:[]};
    // {fed.wiki.org: [{slug: "happenings", title: "Happenings", date: 1358975303000, synopsis: "Changes here ..."}]}
    for (remoteSite in neighborhood.sites) {
      var info = neighborhood.sites[remoteSite];
      if ((remoteSite !== site) && (info.sitemap != null)) {
        for (item of info.sitemap) {
          if (item.slug === slug) {
            bin = item.date > viewing ? bins.newer
            : item.date < viewing ? bins.older
            : bins.same;
            bin.push({remoteSite, item});
          }
        }
      }
    }
    const twins = [];
    // {newer:[remoteSite: "fed.wiki.org", item: {slug: ..., date: ...}, ...]}
    for (var legend in bins) {
      bin = bins[legend];
      if (!bin.length) { continue; }
      bin.sort((a, b) => a.item.date < b.item.date);
      const flags = [];
      for (let i = 0; i < bin.length; i++) {
        ({remoteSite, item} = bin[i]);
        if (i >= 8) { break; }
        flags.push(`<img class="remote"
src="${wiki.site(remoteSite).flag()}"
data-slug="${slug}"
data-site="${remoteSite}"
title="${remoteSite}">\
`);
      }
      twins.push(`${flags.join('&nbsp;')} ${legend}`);
    }
    if (twins) { $page.find('.twins').html(`<p><span>${twins.join(", ")}</span></p>`); }
  }
};

const renderPageIntoPageElement = function(pageObject, $page) {
  $page.data("data", pageObject.getRawPage());
  if (pageObject.isRemote()) { $page.data("site", pageObject.getRemoteSite()); }

  // console.log '.page keys ', ($(each).data('key') for each in $('.page'))
  // console.log 'lineup keys', lineup.debugKeys()

  resolve.resolutionContext = pageObject.getContext();

  $page.empty();
  const $paper = $("<div class='paper' />");
  $page.append($paper);
  // TODO - simplify loop
  const [$handleParent, $twins, $header, $story, $backlinks, $journal, $footer] = ['handle-parent', 'twins', 'header', 'story', 'backlinks', 'journal', 'footer'].map(function(className) {
    if ((className !== 'journal') || $('.editEnable').is(':visible')) { return $('<div />').addClass(className).appendTo($paper); }
  });
  const $pagehandle = $('<div />').addClass('page-handle').appendTo($handleParent);

  emitHeader($header, $page, pageObject);
  emitTimestamp($header, $page, pageObject);

  let promise = pageObject.seqItems(function(item, done) {
      const $item = $(`<div class="item ${item.type}" data-id="${item.id}">`);
      $story.append($item);
      $item.data('item', item);
      return done();
  });
  promise = promise.then(function() {
    const index = $(".page").index($page[0]);
    const itemIndex = $('.item').index($($('.page')[index]).find('.item'));
    return plugin.renderFrom(itemIndex);}).then(() => $page);

  if ($('.editEnable').is(':visible')) {
    pageObject.seqActions(function(each, done) {
      if (each.separator) { addToJournal($journal, each.separator); }
      addToJournal($journal, each.action);
      return done();
    });
  }

  emitTwins($page);
  emitBacklinks($backlinks, pageObject);
  if ($('.editEnable').is(':visible')) { emitControls($journal); }
  emitFooter($footer, pageObject);
  $pagehandle.css({
    height: `${$story.position().top-$handleParent.position().top-5}px`
  });
  return promise;
};


const createMissingFlag = function($page, pageObject) {
  if (!pageObject.isRemote()) {
    $('img.favicon',$page).on('error', () => plugin.get('favicon', favicon => favicon.create()));
  }
};

const rebuildPage = function(pageObject, $page) {
  if (pageObject.isLocal()) { $page.addClass('local'); }
  if (pageObject.isRecycler()) { $page.addClass('recycler'); }
  if (pageObject.isRemote()) { $page.addClass('remote'); }
  if (pageObject.isPlugin()) { $page.addClass('plugin'); }

  const promise = renderPageIntoPageElement(pageObject, $page);
  createMissingFlag($page, pageObject);

  //STATE -- update url when adding new page, removing others
  state.setUrl();

  if ($('.editEnable').is(':visible')) {
    initDragging($page);
    initMerging($page);
    initAddButton($page);
  }
  return promise;
};

const buildPage = function(pageObject, $page) {
  const pageKey =lineup.addPage(pageObject);
  $page.data('key', pageKey);
  $page.get(0).dataset.key = pageKey;
  return rebuildPage(pageObject, $page);
};

const newFuturePage = function(title, create) {
  const slug = asSlug(title);
  const pageObject = newPage();
  pageObject.setTitle(title);
  const hits = [];
  for (var site in neighborhood.sites) {
    var info = neighborhood.sites[site];
    if (info.sitemap != null) {
      var result = info.sitemap.find(each => each.slug === slug);
      if (result != null) {
        hits.push({
          "type": "reference",
          "site": site,
          "slug": slug,
          "title": result.title || slug,
          "text": result.synopsis || ''
        });
      }
    }
  }
  if (hits.length > 0) {
    pageObject.addItem({
      'type': 'future',
      'text': 'We could not find this page where it was expected.',
      'title': title,
      'create': create,
      'context': pageHandler.context.filter(c => !['view', 'origin', 'local'].includes(c))
    });
    pageObject.addItem({
      'type': 'paragraph',
      'text': "We did find possible duplicate in the current neighborhood."
    });
    for (var hit of hits) { pageObject.addItem(hit); }
  } else {
    pageObject.addItem({
      'type': 'future',
      'text': 'We could not find this page.',
      'title': title,
      'create': create,
      'context': pageHandler.context.filter(c => !['view', 'origin', 'local'].includes(c))
    });
  }
  return pageObject;
};

const cycle = function($page) {
  var promise = new Promise(function(resolve, _reject) {
    const [slug, rev] = $page.attr('id').split('_rev');
    let title = $page.find('.header h1').text().trim();
    const pageInformation = {
      slug,
      rev,
      site: $page.data('site')
    };

    const whenNotGotten = function() {
      const link = $(`a.internal[href="/${slug}.html"]:last`);
      title = title || link.text() || slug;
      const key = link.parents('.page').data('key');
      const create = lineup.atKey(key)?.getCreate();
      const pageObject = newFuturePage(title);
      promise = buildPage( pageObject, $page);
      promise
        .then($page => $page.addClass('ghost'));
      return resolve(promise);
    };

    const whenGotten = function(pageObject) {
      promise = buildPage( pageObject, $page);
      for (var site of pageObject.getNeighbors(location.host)) {
        neighborhood.registerNeighbor(site);
      }
      return resolve(promise);
    };

    return pageHandler.get({
      whenGotten,
      whenNotGotten,
      pageInformation
    });
  });
  return promise;
};

module.exports = {cycle, emitTwins, buildPage, rebuildPage, newFuturePage};
