lineup = require('../lib/lineup')
newPage = require('../lib/page').newPage
expect = require 'expect.js'

describe 'lineup', ->

  it 'should assign unique keys', ->
    pageObject = newPage()
    lineup.debugReset()
    key1 = lineup.addPage pageObject
    key2 = lineup.addPage pageObject
    expect(key1).to.not.equal key2

  it 'should preserve identity', ->
    pageObject = newPage()
    lineup.debugReset()
    key1 = lineup.addPage pageObject
    key2 = lineup.addPage pageObject
    expect(key1).to.not.eql null
    expect(lineup.atKey(key1)).to.be lineup.atKey(key2)

  it 'should remove a page', ->
    pageObject = newPage()
    lineup.debugReset()
    key1 = lineup.addPage pageObject
    key2 = lineup.addPage pageObject
    key3 = lineup.addPage pageObject
    result = lineup.removeKey key2
    expect([lineup.debugKeys(), result]).to.eql [[key1, key3], key2]

  it 'should remove downstream pages', ->
    pageObject = newPage()
    lineup.debugReset()
    key1 = lineup.addPage pageObject
    key2 = lineup.addPage pageObject
    key3 = lineup.addPage pageObject
    result = lineup.removeAllAfterKey key1
    expect([lineup.debugKeys(), result]).to.eql [[key1], [key2, key3]]

  describe 'crumbs', ->

    fromUri = (uri) ->
      lineup.debugReset()
      fields = uri.split /\//
      result = []
      while fields.length
        host = fields.shift()
        result.push lineup.addPage newPage {title: fields.shift()}, host
      result

    it 'should reload welcome', ->
      keys = fromUri 'view/welcome-visitors'
      crumbs = lineup.crumbs keys[0], 'foo.com'
      expect(crumbs).to.eql ['foo.com', 'view', 'welcome-visitors']

    it 'should load remote welcome', ->
      keys = fromUri 'bar.com/welcome-visitors'
      crumbs = lineup.crumbs keys[0], 'foo.com'
      expect(crumbs).to.eql ['bar.com', 'view', 'welcome-visitors']

    it 'should reload welcome before some-page', ->
      keys = fromUri 'view/some-page'
      crumbs = lineup.crumbs keys[0], 'foo.com'
      expect(crumbs).to.eql ['foo.com', 'view', 'welcome-visitors', 'view', 'some-page']

    it 'should load remote welcome and some-page', ->
      keys = fromUri 'bar.com/some-page'
      crumbs = lineup.crumbs keys[0], 'foo.com'
      expect(crumbs).to.eql ['bar.com', 'view', 'welcome-visitors', 'view', 'some-page']

    it 'should remote the adjacent local page when changing origin', ->
      keys = fromUri 'view/once-local/bar.com/some-page'
      crumbs = lineup.crumbs keys[1], 'foo.com'
      expect(crumbs).to.eql ['bar.com', 'view', 'welcome-visitors', 'view', 'some-page', 'foo.com', 'once-local']

    it 'should remote the stacked adjacent local page when changing origin', ->
      keys = fromUri 'view/stack1/view/stack2/view/once-local/bar.com/some-page'
      crumbs = lineup.crumbs keys[3], 'foo.com'
      expect(crumbs).to.eql ['bar.com', 'view', 'welcome-visitors', 'view', 'some-page', 'foo.com', 'once-local']

    it 'should remote the welcome rooted stacked adjacent local page when changing origin', ->
      keys = fromUri 'view/welcome-visitors/view/stack2/view/once-local/bar.com/some-page'
      crumbs = lineup.crumbs keys[3], 'foo.com'
      expect(crumbs).to.eql ['bar.com', 'view', 'welcome-visitors', 'view', 'some-page', 'foo.com', 'once-local']

