// A Future plugin represents a page that hasn't been written
// or wasn't found where expected. It recognizes template pages
// and offers to clone them or make a blank page.

const resolve = require('./resolve.cjs');
const neighborhood = require('./neighborhood.cjs');

const lineup = require('./lineup.cjs');
const refresh = require('./refresh.cjs');

const emit = function($item, item) {

  let info, transport;
  $item.append(`${item.text}`);
  const proposedSlug = $item.parents('.page:first')[0].id;
  if (wiki.asSlug(item.title) !== proposedSlug) {
    $item.append("<p style='font-weight: 500;'>Page titles with leading/trailing spaces cannot be used to create a new page.</p>");
  } else {
    $item.append("<br><br><button class=\"create\">create</button> new blank page");
  }

  if (transport = item.create?.source?.transport) {
    $item.append(`<br><button class="transport" data-slug=${item.slug}>create</button> transport from ${transport}`);
    $item.append("<p class=caption> unavailable</p>");
    $.get('//localhost:4020', () => $item.find('.caption').text('ready'));
  }

  if ((info = neighborhood.sites[location.host]) && info.sitemap) {
    for (var localPage of info.sitemap) {
      if (localPage.slug.match(/-template$/)) {
        $item.append(`<br><button class="create" data-slug=${localPage.slug}>create</button> from ${resolve.resolveLinks(`[[${localPage.title}]]`)}`);
      }
    }
  }

  if (item.context?.length > 0 || (isSecureContext && !location.hostname.endsWith('localhost'))) {
    $item.append(`\
<p>Some possible places to look for this page, if it exists.</p>\
`
    );
  }

  let offerAltLineup = true;

  if (item.context?.length > 0) {
    const offerPages = [];
    item.context.forEach((c) => {
      if (wiki.neighborhood[c].lastModified === 0) {
        const slug = wiki.asSlug(item.title);
        offerPages.push(`\
<p>
  <img class='remote'
    src='${wiki.site(c).flag()}'
    title="${c}">
  <a class='internal'
    href='http://${c}/${slug}.html'
    target='_blank'>${c}</a>
</p>\
`
        );
      }
    });
    if (offerPages.length > 0) {
      $item.append(`\
<div>
  <p>Try on remote wiki where it was expected to be found, opens in a new tab.</p>
  ${offerPages.join('\n')}
</div>\
`
      );
    } else {
      offerAltLineup = false;
      $item.append(`\
<div>
  <p>None of the expected places were unreachable.</p>
</div>\
`
      );
    }
  } else {
    offerAltLineup = false;
  }

  if (isSecureContext && offerAltLineup && !location.hostname.endsWith('localhost')) {
    const altContext = document.URL.replace(/^https/, 'http').replace(/\/\w+\/[\w-]+$/, '');
    const altLinkText = altContext.length > 55 ? altContext.substring(0,55)+'...' : altContext;
    $item.append(`\
<div>
  <p>Try opening lineup using http, opens in a new tab.</p>
  <p><a href="${altContext}" target="_blank"><img class='remote' src='/favicon.png' title='${location.host}'> ${altLinkText}</a>.</p>
</div>
<div>
  <p>
</div>\
`
    );
  }
};

const bind = ($item, item) => $item.find('button.transport').on('click', function(e) {
  $item.find('.caption').text('waiting');

  // duplicatingTransport and Templage logic

  const params = {
    title: $item.parents('.page').data('data').title,
    create: item.create
  };

  const req = {
    type: "POST",
    url: item.create.source.transport,
    dataType: 'json',
    contentType: "application/json",
    data: JSON.stringify(params)
  };

  $.ajax(req).done(function(page) {
    $item.find('.caption').text('ready');
    const resultPage = wiki.newPage(page);
    const $page = $item.parents('.page');
    const pageObject = lineup.atKey($page.data('key'));
    pageObject.become(resultPage,resultPage);
    page = pageObject.getRawPage();
    refresh.rebuildPage(pageObject, $page.empty());
  });
});


module.exports = {emit, bind};
