expect = require 'expect.js'
_ = require 'underscore'
miniSearch = require 'minisearch'


neighborhood = require '../lib/neighborhood'

describe 'neighborhood', ->

  describe 'no neighbors', ->
    it 'should return an empty array for our search', ->
      searchResult = neighborhood.search( "query string" )
      expect(searchResult.finds).to.eql( [] )


  describe 'a single neighbor with a few pages', ->
    before ->
      fakeSitemap = [
        { title: 'Page One', slug: 'page-one', date: 'date1' },
        { title: 'Page Two', slug: 'page-two', date: 'date2' },
        { title: 'Page Three', slug: 'page-three' }
      ]

      fakeSiteindex = new miniSearch({
        fields: ['title', 'content']
      })

      fakeSitemap.forEach((page) ->
        fakeSiteindex.add {
          'id': page.slug
          'title': page.title
          'content': ''
        }
        return
      )

      neighbor = {
        sitemap: fakeSitemap,
        siteIndex: fakeSiteindex
      }

      neighborhood.sites = {}
      neighborhood.sites['my-site'] = neighbor

    it 'returns all pages that match the query', ->
      searchResult = neighborhood.search( "Page" )
      expect( searchResult.finds ).to.have.length(3)

    it 'returns only pages that match the query', ->
      searchResult = neighborhood.search( "Page T" )
      expect( searchResult.finds ).to.have.length(2)

    it 'should package the results in the correct format', ->
      expectedResult = [
        {
          site: 'my-site',
          page: { title: 'Page Two', slug: 'page-two', date: 'date2' }
        }
      ]
      searchResult = neighborhood.search( "Page Two" )
      expect( searchResult.finds.site ).to.eql( expectedResult.site )
      expect( searchResult.finds.page ).to.eql( expectedResult.page )


    it.skip 'searches both the slug and the title'

  describe 'more than one neighbor', ->
    before ->
      neighborhood.sites = {}
      neighborhood.sites['site-one'] = {
        sitemap: [
          { title: 'Page One from Site 1', slug: 'page-one-from-site-1' },
          { title: 'Page Two from Site 1', slug: 'page-two-from-site-1' },
          { title: 'Page Three from Site 1', slug: 'page-three-from-site-1' }
        ],
      }

      site1Siteindex = new miniSearch({
        fields: ['title', 'content']
      })

      neighborhood.sites['site-one'].sitemap.forEach((page) ->
        site1Siteindex.add {
          'id': page.slug
          'title': page.title
          'content': ''
        }
        return
      )
      neighborhood.sites['site-one'].siteIndex = site1Siteindex

      neighborhood.sites['site-two'] = {
        sitemap: [
          { title: 'Page One from Site 2', slug: 'page-one-from-site-2' },
          { title: 'Page Two from Site 2', slug: 'page-two-from-site-2' },
          { title: 'Page Three from Site 2', slug: 'page-three-from-site-2' }
        ]
      }

      site2Siteindex = new miniSearch({
        fields: ['title', 'content']
      })

      neighborhood.sites['site-two'].sitemap.forEach((page) ->
        site2Siteindex.add {
          'id': page.slug
          'title': page.title
          'content': ''
        }
        return
      )
      neighborhood.sites['site-two'].siteIndex = site2Siteindex

    it 'returns matching pages from every neighbor', ->
      searchResult = neighborhood.search( "Page Two" )
      expect( searchResult.finds ).to.have.length(2)
      sites = _.pluck( searchResult.finds, 'site' )
      expect( sites.sort() ).to.eql( ['site-one','site-two'].sort() )


  describe 'an unpopulated neighbor', ->
    before ->
      neighborhood.sites = {}
      neighborhood.sites['unpopulated-site'] = {}

    it 'gracefully ignores unpopulated neighbors', ->
      searchResult = neighborhood.search( "some search query" )
      expect( searchResult.finds ).to.be.empty()

    it.skip 'should re-populate the neighbor'
