state = require('../lib/state')
lineup = require('../lib/lineup')
expect = require 'expect.js'

# here we test manipulations of the lineup and window.location

describe 'state', ->
  actual = null
  title = null
  tests = [
    # [pathname, locs, pages]
    ['/', [], []],
    ['/view/welcome-visitors', ['view'], ['welcome-visitors']],
    ['/view/foo/view/bar', ['view', 'view'], ['foo', 'bar']],
    ['/view/welcome-visitors/fed.wiki.org/featured-sites',
      ['view', 'fed.wiki.org'], ['welcome-visitors', 'featured-sites']],
    ['/welcome-visitors.html', ['view'], ['welcome-visitors']],
    ['/how-to-wiki.html', ['view'], ['how-to-wiki']]
  ]
  before ->
    global.$ = (el) -> {attr: (key) -> el[key]}
    global.history =
      pushState: (state, title, url) -> actual = url
    lineup.bestTitle = () -> title

  context 'using URL.pathname', ->
    for [pathname, locs, pages] in tests
      context pathname, ->
        beforeEach ->
          global.location = new URL("https://example.com#{pathname}")
        it "urlPages() is [#{pages}]", ->
          expect(state.urlPages()).to.eql(pages)
        it "urlLocs() is [#{locs}]", ->
          expect(state.urlLocs()).to.eql(locs)
    describe 'setUrl', ->
      beforeEach ->
        actual = null
        title = 'Welcome Visitors'
        global.location = new URL('https://example.com/view/welcome-visitors')
        global.document = {title: null}
      it 'does not push url to history for the same location', ->
        state.pagesInDom = -> ['welcome-visitors']
        state.locsInDom = -> ['view']
        state.setUrl()
        expect(actual).to.be(null)
      it 'pushes url to history when location changes', ->
        state.pagesInDom = -> ['welcome-visitors', 'welcome-visitors']
        state.locsInDom = -> ['view', 'fed.wiki.org']
        state.setUrl()
        expect(global.document.title).to.be('Welcome Visitors')
        expect(actual.pathname).to.be('/view/welcome-visitors/fed.wiki.org/welcome-visitors')

  context 'using URL.hash', ->
    for [stat, locs, pages] in tests
      context stat, ->
        beforeEach ->
          global.location = new URL("https://example.com#stat=#{stat}")
        it "urlPages() is [#{pages}]", ->
          expect(state.urlPages()).to.eql(pages)
        it "urlLocs() is [#{locs}]", ->
          expect(state.urlLocs()).to.eql(locs)
    describe 'setUrl', ->
      beforeEach ->
        actual = null
        title = 'Welcome Visitors'
        global.location = new URL('https://example.com#stat=view/welcome-visitors')
        global.document = {title: null}
      it 'does not push url to history for the same location', ->
        state.pagesInDom = -> ['welcome-visitors']
        state.locsInDom = -> ['view']
        state.setUrl()
        expect(actual).to.be(null)
      it 'pushes url to history when location changes', ->
        state.pagesInDom = -> ['welcome-visitors', 'welcome-visitors']
        state.locsInDom = -> ['view', 'fed.wiki.org']
        state.setUrl()
        expect(global.document.title).to.be('Welcome Visitors')
        params = new URLSearchParams(actual.hash.substring(1))
        expect(params.get('stat'))
          .to.be('view/welcome-visitors/fed.wiki.org/welcome-visitors')

  it 'setUrl() defaults to URL.hash', ->
    actual = null
    global.location = new URL('https://example.com')
    global.document = {title: null}
    state.pagesInDom = -> ['welcome-visitors']
    state.locsInDom = -> ['view']
    state.setUrl()
    expect(actual.pathname).to.be('/')
    params = new URLSearchParams(actual.hash.substring(1))
    expect(params.get('stat')).to.be('view/welcome-visitors')
