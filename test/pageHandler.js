const _ = require('underscore')
const expect = require('expect.js')
const sinon = require('sinon')

const pageHandler = require('../lib/pageHandler')
const mockServer = require('./mockServer')

// disable reference to dom
pageHandler.useLocalStorage = () => false

describe('pageHandler.get', function () {
  it('should have an empty context', () => expect(pageHandler.context).to.eql([]))

  const pageInformationWithoutSite = {
    slug: 'slugName',
    rev: 'revName',
  }

  const genericPageInformation = _.extend({}, pageInformationWithoutSite, { site: 'siteName' })

  const genericPageData = {
    journal: [],
  }

  beforeEach(function () {
    const wiki = {}
    wiki.local = {
      get(route, done) {
        done({ msg: `no page named '${route}' in browser local storage` })
      },
    }
    wiki.origin = {
      get(route, done) {
        $.ajax({
          type: 'GET',
          dataType: 'json',
          url: `/${route}`,
          success(page) {
            done(null, page)
          },
          error(xhr, type, msg) {
            done({ msg, xhr }, null)
          },
        })
      },
      put(route, data, done) {
        $.ajax({
          type: 'PUT',
          url: `/page/${route}/action`,
          data: {
            action: JSON.stringify(data),
          },
          success() {
            done(null)
          },
          error(xhr, type, msg) {
            done({ xhr, type, msg })
          },
        })
      },
    }
    wiki.site = site => ({
      get(route, done) {
        const url = `//${site}/${route}`
        $.ajax({
          type: 'GET',
          dataType: 'json',
          url,
          success(data) {
            done(null, data)
          },
          error(xhr, type, msg) {
            done({ msg, xhr }, null)
          },
        })
      },
    })
    globalThis.wiki = wiki
  })

  describe('ajax fails', function () {
    before(() => mockServer.simulatePageNotFound())

    after(() => jQuery.ajax.restore())

    it("should tell us when it can't find a page (server specified)", function () {
      const whenGotten = sinon.spy()
      const whenNotGotten = sinon.spy()

      pageHandler.get({
        pageInformation: _.clone(genericPageInformation),
        whenGotten,
        whenNotGotten,
      })

      expect(whenGotten.called).to.be.false
      expect(whenNotGotten.called).to.be.true
    })

    it("should tell us when it can't find a page (server unspecified)", function () {
      const whenGotten = sinon.spy()
      const whenNotGotten = sinon.spy()

      pageHandler.get({
        pageInformation: _.clone(pageInformationWithoutSite),
        whenGotten,
        whenNotGotten,
      })

      expect(whenGotten.called).to.be.false
      expect(whenNotGotten.called).to.be.true
    })
  })

  describe('ajax, success', function () {
    before(function () {
      sinon.stub(jQuery, 'ajax').yieldsTo('success', genericPageData)
      $('<div id="pageHandler5" data-site="foo" />').appendTo('body')
    })

    it('should get a page from specific site', function () {
      const whenGotten = sinon.spy()
      pageHandler.get({
        pageInformation: _.clone(genericPageInformation),
        whenGotten,
      })

      expect(whenGotten.calledOnce).to.be.true
      expect(jQuery.ajax.calledOnce).to.be.true
      expect(jQuery.ajax.args[0][0]).to.have.property('type', 'GET')
      expect(jQuery.ajax.args[0][0].url).to.match(new RegExp(`^//siteName/slugName\\.json`))
    })

    after(() => jQuery.ajax.restore())
  })

  describe('ajax, search', function () {
    before(function () {
      mockServer.simulatePageNotFound()
      return (pageHandler.context = ['view', 'example.com', 'asdf.test', 'foo.bar'])
    })

    it('should search through the context for a page', function () {
      pageHandler.get({
        pageInformation: _.clone(pageInformationWithoutSite),
        whenGotten: sinon.stub(),
        whenNotGotten: sinon.stub(),
      })

      expect(jQuery.ajax.args[0][0].url).to.match(new RegExp(`^/slugName\\.json`))
      expect(jQuery.ajax.args[1][0].url).to.match(new RegExp(`^//example.com/slugName\\.json`))
      expect(jQuery.ajax.args[2][0].url).to.match(new RegExp(`^//asdf.test/slugName\\.json`))
      expect(jQuery.ajax.args[3][0].url).to.match(new RegExp(`^//foo.bar/slugName\\.json`))
    })

    after(() => jQuery.ajax.restore())
  })
})

describe('pageHandler.put', function () {
  before(function () {
    $('<div id="pageHandler3" />').appendTo('body')
    sinon.stub(jQuery, 'ajax').yieldsTo('success')
  })

  // can't test right now as expects to have access to original page, so index can be updated.
  it.skip('should save an action', function (done) {
    const action = { type: 'edit', id: 1, item: { id: 1 } }
    pageHandler.put($('#pageHandler3'), action)
    expect(jQuery.ajax.args[0][0].data).to.eql({ action: JSON.stringify(action) })
    done()
  })

  after(() => jQuery.ajax.restore())
})
