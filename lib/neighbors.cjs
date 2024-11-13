// This module manages the display of site flags representing
// fetched sitemaps stored in the neighborhood. It progresses
// through a series of states which, when attached to the flags,
// cause them to animate as an indication of work in progress.

const link = require('./link.cjs');
const wiki = require('./wiki.cjs');
const neighborhood = require('./neighborhood.cjs');
const util = require('./util.cjs');

let sites = null;
let totalPages = 0;

const hasLinks = element => element.hasOwnProperty('links');


const flag = site => // status class progression: .wait, .fetch, .fail or .done
`\
<span class="neighbor" data-site="${site}">
<div class="wait">
  <img src="${wiki.site(site).flag()}" title="${site}">
</div>
</span>\
`;

const inject = neighborhood => sites = neighborhood.sites;

const formatNeighborTitle = function(site) {
  let error, pageCount;
  let title = '';
  title += `${site}\n`;
  try {
    pageCount = sites[site].sitemap.length;
  } catch (error1) {
    error = error1;
    pageCount = 0;
  }
  try {
    if (sites[site].sitemap.some(hasLinks)) {
      title += `${pageCount} pages with 2-way links\n`;
    } else {
      title += `${pageCount} pages\n`;
    }
  } catch (error2) {
    error = error2;
    console.info('+++ sitemap not valid for ', site);
  }
  if (sites[site].lastModified !== 0) {
    title += `Updated ${util.formatElapsedTime(sites[site].lastModified)}`;
    if ((sites[site].nextCheck - Date.now()) > 0) { title += `, next refresh ${util.formatDelay(sites[site].nextCheck)}`; }
  }
  return title;
};


const bind = function() {
  const $neighborhood = $('.neighborhood');
  $('body')
    .on('new-neighbor', (e, site) => $neighborhood.append(flag(site))).on('new-neighbor-done', function(e, site) {
      let pageCount;
      try {
        pageCount = sites[site].sitemap.length;
      } catch (error1) {
        const error = error1;
        pageCount = 0;
      }
      totalPages = Object.values(neighborhood.sites).reduce((function(sum, site) {
        try {
          if (site.sitemapRequestInflight) {
            return sum;
          } else {
            return sum + site.sitemap.length;
          }
        } catch (error) {
          return sum;
        }
        }), 0);
      $('.searchbox .pages').text(`${totalPages} pages`);
    })
    .on('mouseenter', '.neighbor', function(e) {
      const $neighbor = $(e.currentTarget);
      const {
        site
      } = $neighbor.data();
      $neighbor.find('img:first').attr('title', formatNeighborTitle(site));
    }).on('click', '.neighbor img', function(e) {
      // add handling refreshing neighbor that has failed
      if ($(e.target).parent().hasClass('fail')) {
        $(e.target).parent().removeClass('fail').addClass('wait');
        const site = $(e.target).attr('title').split('\n')[0];
        wiki.site(site).refresh(function() {
          console.log('about to retry neighbor');
          neighborhood.retryNeighbor(site);
        });
      } else {
        link.doInternalLink('welcome-visitors', null, this.title.split("\n")[0]);
      }
    });
};

module.exports = {inject, bind};
