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
// The legacy module is what is left of the single javascript
// file that once was Smallest Federated Wiki. Execution still
// starts here and many event dispatchers are set up before
// the user takes control.

const pageHandler = require('./pageHandler');
const state = require('./state');
const active = require('./active');
const refresh = require('./refresh');
const lineup = require('./lineup');
const drop = require('./drop');
const dialog = require('./dialog');
const link = require('./link');
const target = require('./target');
const license = require('./license');
const plugin = require('./plugin');
const util = require('./util');
const wiki = require('./wiki');

const {
  asSlug
} = require('./page');
const {
  newPage
} = require('./page');

const preLoadEditors = catalog => catalog
  .filter(entry => entry.editor)
  .forEach(function(entry) {
    console.log(`${entry.name} Plugin declares an editor, so pre-loading the plugin`);
    return wiki.getPlugin(entry.name.toLowerCase(), function(plugin) {
        if (!plugin.editor || (typeof plugin.editor !== 'function')) {
          return console.log(`${entry.name} Plugin ERROR.
Cannot find \`editor\` function in plugin. Set \`"editor": false\` in factory.json or
Correct the plugin to include all three of \`{emit, bind, editor}\`\
`);
        }
      });
  });

wiki.origin.get('system/factories.json', function(error, data) {
  if (Array.isArray(data)) {
    window.catalog = data;
    return preLoadEditors(data);
  }
});

$(function() {

// FUNCTIONS used by plugins and elsewhere


  const LEFTARROW = 37;
  const RIGHTARROW = 39;

  $(document).on("keydown", function(event) {
    const direction = (() => { switch (event.which) {
      case LEFTARROW: return -1;
      case RIGHTARROW: return +1;
    } })();
    if (direction && !$(event.target).is(":input")) {
      const pages = $('.page');
      const newIndex = pages.index($('.active')) + direction;
      if (0 <= newIndex && newIndex < pages.length) {
        active.set(pages.eq(newIndex));
      }
    }
    if ((event.ctrlKey || event.metaKey) && (event.which === 83)) { //ctrl-s for search
      event.preventDefault();
      return $('input.search').trigger('focus');
    }
  });

// HANDLERS for jQuery events

  //STATE -- reconfigure state based on url
  $(window).on('popstate', state.show);

  $(document)
    .ajaxError(function(event, request, settings) {
      if ((request.status === 0) || (request.status === 404)) { return; }
      return console.log('ajax error', event, request, settings);
  });
      // $('.main').prepend """
      //   <li class='error'>
      //     Error on #{settings.url}: #{request.responseText}
      //   </li>
      // """

  const commas = number => `${number}`.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");

  const readFile = function(file) {
    if (file?.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = function(e) {
        const {
          result
        } = e.target;
        let pages = JSON.parse(result);
        const resultPage = newPage();
        resultPage.setTitle(`Import from ${file.name}`);
        if ((pages.title != null) && (pages.story != null) && (pages.journal != null)) {
          const slug = asSlug(pages.title);
          const page = pages;
          pages = {};
          pages[slug] = page;
          resultPage.addParagraph(`\
Import of one page
(${commas(file.size)} bytes)
from a page-json file dated ${file.lastModifiedDate}.\
`
          );
        } else {
          resultPage.addParagraph(`\
Import of ${Object.keys(pages).length} pages
(${commas(file.size)} bytes)
from an export file dated ${file.lastModifiedDate}.\
`
          );
        }
        resultPage.addItem({type: 'importer', pages});
        return link.showResult(resultPage);
      };
      return reader.readAsText(file);
    }
  };

  const deletePage = (pageObject, $page) => // console.log 'fork to delete'
  pageHandler.delete(pageObject, $page, function(err) {
    if (err != null) { return; }
    // console.log 'server delete successful'
    if (pageObject.isRecycler()) {
      // make recycler page into a ghost
      return $page.addClass('ghost');
    } else {
      const futurePage = refresh.newFuturePage(pageObject.getTitle(), pageObject.getCreate());
      pageObject.become(futurePage);
      $page.attr('id', futurePage.getSlug());
      refresh.rebuildPage(pageObject, $page);
      return $page.addClass('ghost');
    }
  });

  const getTemplate = function(slug, done) {
    if (!slug) { return done(null); }
    console.log('getTemplate', slug);
    return pageHandler.get({
      whenGotten(pageObject /*,siteFound*/) { return done(pageObject); },
      whenNotGotten() { return done(null); },
      pageInformation: {slug}});
  };

  const finishClick = function(e, name) {
    let page;
    e.preventDefault();
    if (!e.shiftKey) { page = $(e.target).parents('.page'); }
    link.doInternalLink(name, page, $(e.target).data('site'));
    return false;
  };

  let originalPageIndex = null;
  $('.main')
    .sortable({handle: '.page-handle', cursor: 'grabbing'})
      .on('sortstart', function(evt, ui) {
        if (!ui.item.hasClass('page')) { return; }
        const noScroll = true;
        active.set(ui.item, noScroll);
        return originalPageIndex = $(".page").index(ui.item[0]);
    }).on('sort', function(evt, ui) {
        if (!ui.item.hasClass('page')) { return; }
        const $page = ui.item;
        // Only mark for removal if there's more than one page (+placeholder) left
        if ((evt.pageY < 0) && ($(".page").length > 2)) {
          return $page.addClass('pending-remove');
        } else {
          return $page.removeClass('pending-remove');
        }
      }).on('sortstop', function(evt, ui) {
        if (!ui.item.hasClass('page')) { return; }
        const $page = ui.item;
        const $pages = $('.page');
        let index = $pages.index($('.active'));
        let firstItemIndex = $('.item').index($page.find('.item')[0]);
        if ($page.hasClass('pending-remove')) {
          if ($pages.length === 1) { return; }
          lineup.removeKey($page.data('key'));
          $page.remove();
          active.set($('.page')[index]);
        } else {
          lineup.changePageIndex($page.data('key'), index);
          active.set($('.active'));
          if (originalPageIndex < index) {
            index = originalPageIndex;
            firstItemIndex = $('.item').index($($('.page')[index]).find('.item')[0]);
          }
        }
        plugin.renderFrom(firstItemIndex);
        state.setUrl();
        if (window.debug) { return state.debugStates(); }
        }).on('click', '.show-page-license', function(e) {
      e.preventDefault();
      const $page = $(this).parents('.page');
      const title = $page.find('h1').text().trim();
      return dialog.open(`License for ${title}`, license.info($page));
      }).on('click', '.show-page-source', function(e) {
      e.preventDefault();
      const $page = $(this).parents('.page');
      const page = lineup.atKey($page.data('key')).getRawPage();
      return dialog.open(`JSON for ${page.title}`,  $('<pre/>').text(JSON.stringify(page, null, 2)));
    }).on('click', '.page', function(e) {
      if (!$(e.target).is("a")) { return active.set(this); }
    }).on('click', '.internal', function(e) {
      const $link = $(e.target);
      let title = $link.text() || $link.data('pageName');
      // ensure that name is a string (using string interpolation)
      title = `${title}`;
      pageHandler.context = $(e.target).attr('title').split(' => ');
      return finishClick(e, title);
    }).on('click', 'img.remote', function(e) {
      // expand to handle click on temporary flag
      if ($(e.target).attr('src').startsWith('data:image/png')) {
        e.preventDefault();
        const site = $(e.target).data('site');
        return wiki.site(site).refresh(function() {});
          // empty function...
      } else {
        const name = $(e.target).data('slug');
        pageHandler.context = [$(e.target).data('site')];
        return finishClick(e, name);
      }
    }).on('dblclick', '.revision', function(e) {
      e.preventDefault();
      const $page = $(this).parents('.page');
      const page = lineup.atKey($page.data('key')).getRawPage();
      const rev = page.journal.length-1;
      const action = page.journal[rev];
      const json = JSON.stringify(action, null, 2);
      return dialog.open(`Revision ${rev}, ${action.type} action`, $('<pre/>').text(json));
      }).on('click', '.action', function(e) {
      e.preventDefault();
      const $action = $(e.target);
        let name = $action.data('slug');
      if ($action.is('.fork') && (name != null)) {
        pageHandler.context = [$action.data('site')];
        return finishClick(e, (name.split('_'))[0]);
      } else {
        const $page = $(this).parents('.page');
        const key = $page.data('key');
        const slug = lineup.atKey(key).getSlug();
        const rev = $(this).parent().children().not('.separator').index($action);
        if (rev < 0) { return; }
        if (!e.shiftKey) { $page.nextAll().remove(); }
        if (!e.shiftKey) { lineup.removeAllAfterKey(key); }
        link.createPage(`${slug}_rev${rev}`, $page.data('site'))
          .appendTo($('.main'))
          .each((_i, e) => refresh.cycle($(e)));
        return active.set($('.page').last());
      }
    }).on('mouseenter', '.action', function(e) {
      const $action = $(e.target);
      const {
        action
      } = $action.data();
      return $action.attr('title',util.formatActionTitle(action));
      }).on('click', '.fork-page', function(e) {
      const $page = $(e.target).parents('.page');
      if ($page.find('.future').length) { return; }
      const pageObject = lineup.atKey($page.data('key'));
      if ($page.attr('id').match(/_rev0$/)) {
        return deletePage(pageObject, $page);
      } else {
        const action = {type: 'fork'};
        if ($page.hasClass('local')) {
          if (pageHandler.useLocalStorage()) { return; }
          $page.removeClass('local');
        } else if (pageObject.isRecycler()) {
          $page.removeClass('recycler');
        } else if (pageObject.isRemote()) {
          action.site = pageObject.getRemoteSite();
        }
        if ($page.data('rev') != null) {
          $page.find('.revision').remove();
        }
        $page.removeClass('ghost');
        $page.attr('id', $page.attr('id').replace(/_rev\d+$/,''));
        state.setUrl();
        const iterable = $('.page');
        for (let i = 0; i < iterable.length; i++) {
          var p = iterable[i];
          var needle = $(p).data('site');
          if (($(p).data('key') !== $page.data('key')) &&
             ($(p).attr('id') === $page.attr('id')) &&
             ([undefined, null, 'view', 'origin', 'local', 'recycler', location.host].includes(needle))) {
            $(p).addClass('ghost');
          }
        }
        return pageHandler.put($page, action);
      }
    }).on('click', 'button.create', e => getTemplate($(e.target).data('slug'), function(template) {
    const $page = $(e.target).parents('.page:first');
    $page.removeClass('ghost');
    const pageObject = lineup.atKey($page.data('key'));
    pageObject.become(template);
    const page = pageObject.getRawPage();
    refresh.rebuildPage(pageObject, $page.empty());
    return pageHandler.put($page, {type: 'create', id: page.id, item: {title:page.title, story:page.story}});
}))

    .on('mouseenter mouseleave', '.score', function(e) {
      console.log("in .score...");
      return $('.main').trigger('thumb', $(e.target).data('thumb'));
  }).on('click', 'a.search', function(e) {
      const $page = $(e.target).parents('.page');
      const key = $page.data('key');
      const pageObject = lineup.atKey(key);
      const resultPage = newPage();
      resultPage.setTitle(`Search from '${pageObject.getTitle()}'`);
      resultPage.addParagraph(`\
Search for pages related to '${pageObject.getTitle()}'.
Each search on this page will find pages related in a different way.
Choose the search of interest. Be patient.\
`
      );
      resultPage.addParagraph("Find pages with links to this title.");
      resultPage.addItem({
        type: 'search',
        text: `SEARCH LINKS ${pageObject.getSlug()}`
      });
      resultPage.addParagraph("Find pages with titles similar to this title.");
      resultPage.addItem({
        type: 'search',
        text: `SEARCH SLUGS ${pageObject.getSlug()}`
      });
      resultPage.addParagraph("Find pages neighboring  this site.");
      resultPage.addItem({
        type: 'search',
        text: `SEARCH SITES ${pageObject.getRemoteSite(location.host)}`
      });
      resultPage.addParagraph("Find pages sharing any of these items.");
      resultPage.addItem({
        type: 'search',
        text: `SEARCH ANY ITEMS ${(Array.from(pageObject.getRawPage().story).map((item) => item.id)).join(' ')}`
      });
      if (!e.shiftKey) { $page.nextAll().remove(); }
      if (!e.shiftKey) { lineup.removeAllAfterKey(key); }
      return link.showResult(resultPage);
    }).on('dragenter', evt => evt.preventDefault())
    .on('dragover', evt => evt.preventDefault())
    .on("drop", drop.dispatch({
      page(item) { return link.doInternalLink(item.slug, null, item.site); },
      file(file) { return readFile(file); }
    })
  );

  $(".provider input").on('click', function() {
    $("footer input:first").val($(this).attr('data-provider'));
    return $("footer form").submit();
  });

  $('body').on('new-neighbor-done', (/*e, neighbor*/) => $('.page').each((_index, element) => refresh.emitTwins($(element))));
      // refresh backlinks??

  const getPluginReference = title => new Promise(function(resolve /*, reject */) {
    const slug = asSlug(title);
    return wiki.origin.get(`${slug}.json`, (error, data) => resolve({
      title,
      slug,
      type: "reference",
      text: (error ? error.msg : (data != null ? data.story[0].text : undefined)) || ""
    }));
    });

  $("<span>&nbsp; ☰ </span>")
    .css({"cursor":"pointer"})
    .appendTo('footer')
    .on('click', function() {
      const resultPage = newPage();
      resultPage.setTitle("Selected Plugin Pages");
      resultPage.addParagraph(`\
Installed plugins offer these utility pages:\
`
      );
      if (!window.catalog) { return; }

      const titles = [];
      for (var info of Array.from(window.catalog)) {
        if (info.pages) {
          for (var title of Array.from(info.pages)) {
            titles.push(title);
          }
        }
      }

      return Promise.all(titles.map(getPluginReference)).then(function(items) {
        items.forEach(item => resultPage.addItem(item));
        return link.showResult(resultPage);
      });
  });

  // $('.editEnable').is(':visible')
  $("<span>&nbsp; wiki <span class=editEnable>✔︎</span> &nbsp; </span>")
    .css({"cursor":"pointer"})
    .appendTo('footer')
    .on('click', function() {
      $('.editEnable').toggle();
      return $('.page').each(function() {
        const $page = $(this);
        const pageObject = lineup.atKey($page.data('key'));
        return refresh.rebuildPage(pageObject, $page.empty());
      });
  });
  if (!isAuthenticated) { $('.editEnable').toggle(); }

  target.bind();

  return $(function() {
    state.first();
    const pages = $('.page').toArray();
    // Render pages in order
    // Emits and "bind creations" for the previous page must be complete before we start
    // rendering the next page or plugin bind ordering will not work
    var renderNextPage = function(pages) {
      if (pages.length === 0) {
        active.set($('.page').last());
        return;
      }
      const $page = $(pages.shift());
      return refresh.cycle($page).then(() => renderNextPage(pages));
    };
    return renderNextPage(pages);
  });
});
