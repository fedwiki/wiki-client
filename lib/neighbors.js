// This module manages the display of site flags representing
// fetched sitemaps stored in the neighborhood. It progresses
// through a series of states which, when attached to the flags,
// cause them to animate as an indication of work in progress.

const link = require('./link')
const wiki = require('./wiki')
const neighborhood = require('./neighborhood')
const util = require('./util')

let sites = null
let totalPages = 0

const hasLinks = element => Object.hasOwn(element, 'links')

// status class progression: .wait, .fetch, .fail or .done

const flag = site =>
  `\
<span class="neighbor" data-site="${site}" ${site != window.location.hostname ? 'draggable="true"' : ''}>
<div class="wait">
  <img src="${wiki.site(site).flag()}" title="${site}">
</div>
</span>\
`

const inject = neighborhood => (sites = neighborhood.sites)

const formatNeighborTitle = function (site) {
  let pageCount
  let title = ''
  title += `${site}\n`
  try {
    pageCount = sites[site].sitemap.length
  } catch {
    pageCount = 0
  }
  try {
    if (sites[site].sitemap.some(hasLinks)) {
      title += `${pageCount} pages with 2-way links\n`
    } else {
      title += `${pageCount} pages\n`
    }
  } catch {
    console.info('+++ sitemap not valid for ', site)
  }
  if (sites[site].lastModified !== 0) {
    title += `Updated ${util.formatElapsedTime(sites[site].lastModified)}`
    if (sites[site].nextCheck - Date.now() > 0) {
      title += `, next refresh ${util.formatDelay(sites[site].nextCheck)}`
    }
  }
  return title
}

// evict a wiki from the neighborhood, from Eric Dobbs (via matrix)
const evict = site => {
  const flagEl = Array.from($('.neighbor')).find(n => n.dataset.site == site)
  flagEl.parentElement.removeChild(flagEl)
  delete wiki.neighborhood[site]
  $('body').trigger('new-neighbor-done', site)
}

const bind = function () {
  const $neighborhood = $('.neighborhood')
  $('body')
    .on('new-neighbor', (e, site) => {
      $neighborhood.append(flag(site))
      if (window.location.hostname != site) {
        const elem = document.querySelector(`footer .neighbor[data-site="${site}"]`)
        elem.addEventListener('dragstart', neighbor_dragstart)
        elem.addEventListener('dragend', neighbor_dragend)
      }
    })
    .on('new-neighbor-done', () => {
      // let pageCount
      // try {
      //   pageCount = sites[site].sitemap.length
      // } catch {
      //   pageCount = 0
      // }
      totalPages = Object.values(neighborhood.sites).reduce(function (sum, site) {
        try {
          if (site.sitemapRequestInflight) {
            return sum
          } else {
            return sum + site.sitemap.length
          }
        } catch {
          return sum
        }
      }, 0)
      $('.searchbox .pages').text(`${totalPages} pages`)
    })
    .on('mouseenter', '.neighbor', function (e) {
      const $neighbor = $(e.currentTarget)
      const { site } = $neighbor.data()
      $neighbor.find('img:first').attr('title', formatNeighborTitle(site))
    })
    .on('click', '.neighbor img', function (e) {
      // add handling refreshing neighbor that has failed
      if ($(e.target).parent().hasClass('fail')) {
        $(e.target).parent().removeClass('fail').addClass('wait')
        const site = $(e.target).attr('title').split('\n')[0]
        wiki.site(site).refresh(function () {
          console.log('about to retry neighbor')
          neighborhood.retryNeighbor(site)
        })
      } else {
        link.doInternalLink('welcome-visitors', null, this.title.split('\n')[0])
      }
    })

  // Handlers for removing wiki from neighborhood

  const neighbor_dragstart = event => {
    document.querySelector('.main').addEventListener('drop', neighbor_drop)
    event.dataTransfer.setData('text/plain', event.target.closest('span').dataset.site)
  }

  const neighbor_dragend = () => {
    document.querySelector('.main').removeEventListener('drop', neighbor_drop)
  }

  const neighbor_drop = event => {
    event.stopPropagation()
    event.preventDefault()
    const toRemove = event.dataTransfer.getData('text/plain')
    if (window.location.hostname != toRemove) {
      console.log(`*** Removing ${toRemove} from neighborhood.`)
      evict(toRemove)
    } else {
      console.log("*** Origin wiki can't be removed.")
    }
    return false
  }
}

module.exports = { inject, bind }
