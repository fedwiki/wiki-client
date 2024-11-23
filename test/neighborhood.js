// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const expect = require('expect.js')
const _ = require('underscore')
const miniSearch = require('minisearch')

const neighborhood = require('../lib/neighborhood')

describe('neighborhood', function () {
  describe('no neighbors', () =>
    it('should return an empty array for our search', function () {
      const searchResult = neighborhood.search('query string')
      expect(searchResult.finds).to.eql([])
    }))

  describe('a single neighbor with a few pages', function () {
    before(function () {
      const fakeSitemap = [
        { title: 'Page One', slug: 'page-one', date: 'date1' },
        { title: 'Page Two', slug: 'page-two', date: 'date2' },
        { title: 'Page Three', slug: 'page-three' },
      ]

      const fakeSiteindex = new miniSearch({
        fields: ['title', 'content'],
      })

      fakeSitemap.forEach(function (page) {
        fakeSiteindex.add({
          id: page.slug,
          title: page.title,
          content: '',
        })
      })

      const neighbor = {
        sitemap: fakeSitemap,
        siteIndex: fakeSiteindex,
      }

      neighborhood.sites = {}
      return (neighborhood.sites['my-site'] = neighbor)
    })

    it('returns all pages that match the query', function () {
      const searchResult = neighborhood.search('Page')
      expect(searchResult.finds).to.have.length(3)
    })

    it('returns only pages that match the query', function () {
      const searchResult = neighborhood.search('Page T')
      expect(searchResult.finds).to.have.length(2)
    })

    it('should package the results in the correct format', function () {
      const expectedResult = [
        {
          site: 'my-site',
          page: { title: 'Page Two', slug: 'page-two', date: 'date2' },
        },
      ]
      const searchResult = neighborhood.search('Page Two')
      expect(searchResult.finds.site).to.eql(expectedResult.site)
      expect(searchResult.finds.page).to.eql(expectedResult.page)
    })

    it.skip('searches both the slug and the title')
  })

  describe('more than one neighbor', function () {
    before(function () {
      neighborhood.sites = {}
      neighborhood.sites['site-one'] = {
        sitemap: [
          { title: 'Page One from Site 1', slug: 'page-one-from-site-1' },
          { title: 'Page Two from Site 1', slug: 'page-two-from-site-1' },
          { title: 'Page Three from Site 1', slug: 'page-three-from-site-1' },
        ],
      }

      const site1Siteindex = new miniSearch({
        fields: ['title', 'content'],
      })

      neighborhood.sites['site-one'].sitemap.forEach(function (page) {
        site1Siteindex.add({
          id: page.slug,
          title: page.title,
          content: '',
        })
      })
      neighborhood.sites['site-one'].siteIndex = site1Siteindex

      neighborhood.sites['site-two'] = {
        sitemap: [
          { title: 'Page One from Site 2', slug: 'page-one-from-site-2' },
          { title: 'Page Two from Site 2', slug: 'page-two-from-site-2' },
          { title: 'Page Three from Site 2', slug: 'page-three-from-site-2' },
        ],
      }

      const site2Siteindex = new miniSearch({
        fields: ['title', 'content'],
      })

      neighborhood.sites['site-two'].sitemap.forEach(function (page) {
        site2Siteindex.add({
          id: page.slug,
          title: page.title,
          content: '',
        })
      })
      return (neighborhood.sites['site-two'].siteIndex = site2Siteindex)
    })

    it('returns matching pages from every neighbor', function () {
      const searchResult = neighborhood.search('Page Two')
      expect(searchResult.finds).to.have.length(2)
      const sites = _.pluck(searchResult.finds, 'site')
      expect(sites.sort()).to.eql(['site-one', 'site-two'].sort())
    })
  })

  describe('an unpopulated neighbor', function () {
    before(function () {
      neighborhood.sites = {}
      return (neighborhood.sites['unpopulated-site'] = {})
    })

    it('gracefully ignores unpopulated neighbors', function () {
      const searchResult = neighborhood.search('some search query')
      expect(searchResult.finds).to.be.empty()
    })

    it.skip('should re-populate the neighbor')
  })
})
