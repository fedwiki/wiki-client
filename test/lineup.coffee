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
