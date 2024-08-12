random = require '../lib/random'
expect = require 'expect.js'

describe 'random', ->

  it 'should make random bytes', ->
    a = random.randomByte()
    expect(a).to.be.a 'string'
    expect(a.length).to.be 2

  it 'should make random byte strings', ->
    s = random.randomBytes(4)
    expect(s).to.be.a 'string'
    expect(s.length).to.be 8

  it 'should make random item ids', ->
    s = random.itemId()
    expect(s).to.be.a 'string'
    expect(s.length).to.be 16
