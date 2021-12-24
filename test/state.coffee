state = require('../lib/state')
lineup = require('../lib/lineup')
expect = require 'expect.js'

# here we test manipulations of the lineup and window.location

describe 'state', ->
  tests = [
    # [pathname, locs, pages]
    ['/', [], []],
    ['/view/welcome-visitors', ['view'], ['welcome-visitors']],
    ['/view/foo/view/bar', ['view', 'view'], ['foo', 'bar']],
    ['/view/welcome-visitors/fed.wiki.org/featured-sites',
      ['view', 'fed.wiki.org'], ['welcome-visitors', 'featured-sites']]
  ]
  beforeEach ->
    global.$ = (el) -> {attr: (key) -> el[key]}

  describe 'urlPages', ->
    for [pathname, locs, pages] in tests
      it pathname, ->
        global.location = {pathname: pathname}
        expect(state.urlPages()).to.eql(pages)

  describe 'urlLocs', ->
    for [pathname, locs, pages] in tests
      it pathname, ->
        global.location = {pathname: pathname}
        expect(state.urlLocs()).to.eql(locs)

  describe 'setUrl', ->
    actual = null
    beforeEach ->
      actual = null
      global.location = new URL('https://example.com/view/welcome-visitors')
      global.document = {title: null}
      global.history =
        pushState: (state, title, url) -> actual = url
    it 'does not push url to history for the same location', ->
      state.pagesInDom = -> ['welcome-visitors']
      state.locsInDom = -> ['view']
      state.setUrl()
      expect(actual).to.be(null)
    it 'pushes url to history when location changes', ->
      state.pagesInDom = -> ['welcome-visitors', 'welcome-visitors']
      state.locsInDom = -> ['view', 'fed.wiki.org']
      state.setUrl()
      expect(global.document.title).to.be('Wiki')
      expect(actual.pathname).to.be('/view/welcome-visitors/fed.wiki.org/welcome-visitors')
