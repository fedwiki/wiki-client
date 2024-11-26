const refresh = require('../lib/refresh')
const lineup = require('../lib/lineup')
const mockServer = require('./mockServer')

describe('refresh', function () {
  let $page = undefined

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
    }
    wiki.site = site => ({
      flag() {
        return `//${site}/favicon.png`
      },

      getDirectURL(route) {
        return `//${site}/${route}`
      },

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

  describe('when page not found', function () {
    before(function () {
      $page = $('<div id="ghost" />')
      $page.appendTo('body')
      mockServer.simulatePageNotFound()
    })
    after(() => jQuery.ajax.restore())

    it.skip('creates a ghost page', function () {
      let key, pageObject
      $page.each(refresh.cycle)
      expect($page.hasClass('ghost')).to.be(true)
      expect((key = $page.data('key'))).to.be.a('string')
      expect((pageObject = lineup.atKey(key))).to.be.an('object')
      expect(pageObject.getRawPage().story[0].type).to.be('future')
    })
  })

  describe('when page found', function () {
    before(function () {
      $page = $('<div id="refresh" />')
      $page.appendTo('body')
      mockServer.simulatePageFound({ title: 'asdf' })
    })
    after(() => jQuery.ajax.restore())

    it.skip('should refresh a page', function (done) {
      $page.each(refresh.cycle)
      expect($('#refresh h1').text().trim()).to.be('asdf')
      done()
    })
  })
})
